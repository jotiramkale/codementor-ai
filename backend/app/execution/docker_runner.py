"""Host-side Docker process management. User code is never run by FastAPI."""

import json
import shutil
import subprocess
import uuid
from dataclasses import dataclass

from app.config import settings
from app.execution.docker_policy import build_docker_command


class ExecutionUnavailable(RuntimeError):
    """Docker or a required, prebuilt runtime image is unavailable."""


class ExecutionBackendError(RuntimeError):
    """The sandbox failed without producing a valid execution result."""


@dataclass(frozen=True)
class DockerResult:
    status: str
    tests: list[dict]
    runtime_ms: float | None
    error: str | None = None


def _short_message(value: str, limit: int = 2000) -> str:
    return value.strip()[:limit]


class DockerExecutionRunner:
    """Run one submission in a fresh Docker container with no local fallback."""

    def __init__(self, config=settings):
        self.config = config
        self.images = {
            "python": config.execution_python_image,
            "javascript": config.execution_javascript_image,
            "java": config.execution_java_image,
            "cpp": config.execution_cpp_image,
        }

    def execute(self, language: str, payload: dict) -> DockerResult:
        image = self.images.get(language)
        if image is None:
            raise ExecutionBackendError("Unsupported execution language.")
        if shutil.which(self.config.execution_docker_command) is None:
            raise ExecutionUnavailable("Docker CLI was not found on the API host.")

        name = f"codementor-job-{uuid.uuid4().hex}"
        command = build_docker_command(self.config, image, name, language)
        try:
            completed = subprocess.run(
                command,
                input=json.dumps(payload, ensure_ascii=True).encode("utf-8"),
                capture_output=True,
                timeout=self.config.execution_job_timeout_seconds,
                check=False,
            )
        except FileNotFoundError as exc:
            self._remove_container(name)
            raise ExecutionUnavailable("Docker CLI was not found on the API host.") from exc
        except subprocess.TimeoutExpired as exc:
            self._remove_container(name)
            raise ExecutionUnavailable(
                "The Docker job exceeded its overall deadline and was terminated."
            ) from exc
        except OSError as exc:
            self._remove_container(name)
            raise ExecutionUnavailable("The API host could not start the Docker command.") from exc

        stdout = completed.stdout.decode("utf-8", errors="replace")
        stderr = completed.stderr.decode("utf-8", errors="replace")
        progress, result = self._parse_output(stdout)
        if completed.returncode != 0:
            was_oom_killed = self._was_oom_killed(name)
            self._remove_container(name)
            if was_oom_killed:
                return DockerResult(
                    status="Memory Limit Exceeded",
                    tests=progress,
                    runtime_ms=sum(test.get("runtime_ms", 0) for test in progress) or None,
                    error="The sandbox reached its memory limit.",
                )
            if result is not None and str(result.get("error", "")).startswith("Sandbox runner error:"):
                raise ExecutionBackendError(result["error"])
            message = _short_message(stderr or stdout)
            if completed.returncode in (125, 126, 127):
                raise ExecutionUnavailable(message or "Docker could not start the sandbox container.")
            raise ExecutionBackendError(message or "The sandbox exited without a result.")

        self._remove_container(name)

        try:
            if result is None:
                raise ValueError("Missing final event")
            status = result["status"]
            tests = result.get("tests", [])
            runtime_ms = result.get("runtime_ms")
            error = result.get("error")
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
            raise ExecutionBackendError("The sandbox returned an invalid result.") from exc

        allowed_statuses = {
            "Accepted",
            "Wrong Answer",
            "Compilation Error",
            "Runtime Error",
            "Time Limit Exceeded",
            "Memory Limit Exceeded",
            "Output Limit Exceeded",
        }
        if status not in allowed_statuses or not isinstance(tests, list):
            raise ExecutionBackendError("The sandbox returned an invalid result.")
        return DockerResult(status=status, tests=tests, runtime_ms=runtime_ms, error=error)

    @staticmethod
    def _parse_output(output: str) -> tuple[list[dict], dict | None]:
        progress = []
        result = None
        for line in output.splitlines():
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(event, dict):
                continue
            if event.get("event") == "test" and isinstance(event.get("test"), dict):
                progress.append(event["test"])
            elif event.get("event") == "result" and isinstance(event.get("result"), dict):
                result = event["result"]
        return progress, result

    def _was_oom_killed(self, name: str) -> bool:
        try:
            inspected = subprocess.run(
                [
                    self.config.execution_docker_command,
                    "inspect",
                    "--format={{.State.OOMKilled}}",
                    name,
                ],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=5,
                check=False,
            )
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
        return inspected.returncode == 0 and inspected.stdout.strip().lower() == "true"

    def _remove_container(self, name: str) -> None:
        try:
            subprocess.run(
                [self.config.execution_docker_command, "rm", "--force", name],
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
                check=False,
            )
        except (FileNotFoundError, subprocess.TimeoutExpired):
            # The unique name plus Docker's normal container exit cleanup
            # prevent this best-effort cleanup from affecting other jobs.
            return
