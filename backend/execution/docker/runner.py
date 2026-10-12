"""Trusted container entry point. User source is only ever a child process."""

import ctypes
import json
import math
import os
import resource
import signal
import subprocess
import sys
import tempfile
import time


SANDBOX_UID = 65534
SANDBOX_GID = 65534
SOURCE_PATHS = {
    "python": "/tmp/codementor_solution.py",
    "javascript": "/tmp/codementor_solution.js",
    "java": "/tmp/Main.java",
    "cpp": "/tmp/codementor_solution.cpp",
}


def env_number(name, default, minimum, maximum):
    try:
        value = float(os.environ.get(name, default))
    except ValueError:
        value = float(default)
    return min(maximum, max(minimum, value))


def env_integer(name, default, minimum, maximum):
    try:
        value = int(os.environ.get(name, default))
    except ValueError:
        value = int(default)
    return min(maximum, max(minimum, value))


def hide_orchestrator_memory():
    # The orchestrator retains expected outputs and later test inputs in
    # memory. It runs as container root and submitted programs run as UID
    # 65534; marking the parent non-dumpable is an additional ptrace guard.
    libc = ctypes.CDLL(None, use_errno=True)
    if libc.prctl(4, 0, 0, 0, 0) != 0:  # PR_SET_DUMPABLE
        error_number = ctypes.get_errno()
        raise OSError(error_number, os.strerror(error_number))


def _set_limits(timeout_seconds, output_limit):
    cpu_seconds = max(1, math.ceil(timeout_seconds))
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_seconds, cpu_seconds + 1))
    resource.setrlimit(resource.RLIMIT_FSIZE, (output_limit + 1, output_limit + 1))
    resource.setrlimit(resource.RLIMIT_NOFILE, (64, 64))
    resource.setrlimit(resource.RLIMIT_CORE, (0, 0))


def _prepare_process(timeout_seconds, output_limit, drop_privileges):
    os.setsid()
    _set_limits(timeout_seconds, output_limit)
    if drop_privileges:
        os.setgroups([])
        os.setgid(SANDBOX_GID)
        os.setuid(SANDBOX_UID)


def _read_limited(file_handle, limit):
    file_handle.flush()
    size = os.fstat(file_handle.fileno()).st_size
    file_handle.seek(0)
    value = file_handle.read(limit + 1)
    return value[:limit], size > limit or len(value) > limit


def _stop_process_family():
    """Kill detached grandchildren left behind by one test case."""
    for _ in range(3):
        found = False
        try:
            process_ids = os.listdir("/proc")
        except OSError:
            return
        for item in process_ids:
            if not item.isdigit() or int(item) in (os.getpid(), os.getppid()):
                continue
            try:
                with open(f"/proc/{item}/status", encoding="ascii") as status_file:
                    for line in status_file:
                        if line.startswith("Uid:"):
                            uid = int(line.split()[1])
                            break
                    else:
                        continue
                if uid == SANDBOX_UID:
                    found = True
                    os.kill(int(item), signal.SIGKILL)
            except (FileNotFoundError, ProcessLookupError, PermissionError, ValueError):
                continue
        if not found:
            return
        time.sleep(0.01)


def _run_process(command, *, stdin_data=None, timeout, output_limit, drop_privileges):
    with tempfile.TemporaryFile(dir="/tmp") as stdout_file, tempfile.TemporaryFile(
        dir="/tmp"
    ) as stderr_file:
        try:
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE if stdin_data is not None else subprocess.DEVNULL,
                stdout=stdout_file,
                stderr=stderr_file,
                cwd="/tmp",
                close_fds=True,
                start_new_session=False,
                preexec_fn=lambda: _prepare_process(timeout, output_limit, drop_privileges),
            )
        except OSError as exc:
            return {
                "returncode": 127,
                "stdout": b"",
                "stderr": str(exc).encode("utf-8", errors="replace")[:output_limit],
                "timed_out": False,
                "output_limited": False,
            }

        try:
            process.communicate(input=stdin_data, timeout=timeout)
            timed_out = False
        except subprocess.TimeoutExpired:
            timed_out = True
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.communicate()
        finally:
            if drop_privileges:
                _stop_process_family()

        stdout, stdout_limited = _read_limited(stdout_file, output_limit)
        stderr, stderr_limited = _read_limited(stderr_file, output_limit)
        return {
            "returncode": process.returncode,
            "stdout": stdout,
            "stderr": stderr,
            "timed_out": timed_out,
            "output_limited": stdout_limited or stderr_limited,
        }


def _command(language, source_path):
    if language == "python":
        return ["python3", source_path], None
    if language == "javascript":
        return ["node", source_path], None
    if language == "java":
        classes_dir = "/tmp/codementor_classes"
        os.makedirs(classes_dir, mode=0o755, exist_ok=True)
        return ["java", "-cp", classes_dir, "Main"], [
            "javac",
            "-encoding",
            "UTF-8",
            "-d",
            classes_dir,
            source_path,
        ]
    if language == "cpp":
        binary_path = "/tmp/codementor_solution"
        return [binary_path], [
            "g++",
            "-std=c++20",
            "-O2",
            "-pipe",
            source_path,
            "-o",
            binary_path,
        ]
    raise ValueError("Unsupported language.")


def _text(data):
    return data.decode("utf-8", errors="replace")


def _normalized(value):
    return value.replace("\r\n", "\n").replace("\r", "\n").rstrip()


def _oom_kill_count():
    try:
        with open("/sys/fs/cgroup/memory.events", encoding="ascii") as events_file:
            for line in events_file:
                key, value = line.split()
                if key == "oom_kill":
                    return int(value)
    except (FileNotFoundError, PermissionError, ValueError):
        return None
    return None


def _emit(value):
    sys.stdout.write(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def run(payload, report_progress=None):
    source = payload.get("source")
    tests = payload.get("tests")
    if not isinstance(source, str) or not isinstance(tests, list) or not tests:
        raise ValueError("Malformed execution request.")
    language = os.environ.get("CM_LANGUAGE", "")
    if language not in SOURCE_PATHS:
        # Image wrappers set CM_LANGUAGE before invoking this entry point.
        language = os.path.basename(sys.argv[0]).removeprefix("runner-")
    if language not in SOURCE_PATHS:
        raise ValueError("The runtime image did not declare its language.")

    time_limit = env_number("CM_TIME_LIMIT_SECONDS", 3, 0.2, 30)
    compile_timeout = env_number("CM_COMPILE_TIMEOUT_SECONDS", 20, 1, 60)
    output_limit = env_integer("CM_OUTPUT_LIMIT_BYTES", 32768, 1024, 1048576)

    hide_orchestrator_memory()
    source_path = SOURCE_PATHS[language]
    with open(source_path, "w", encoding="utf-8", newline="") as source_file:
        source_file.write(source)
    os.chmod(source_path, 0o444)

    command, compile_command = _command(language, source_path)
    if compile_command:
        oom_before_compile = _oom_kill_count()
        compilation = _run_process(
            compile_command,
            timeout=compile_timeout,
            output_limit=output_limit,
            drop_privileges=False,
        )
        oom_after_compile = _oom_kill_count()
        compile_error = _text(compilation["stderr"] or compilation["stdout"]).strip()
        if (
            oom_before_compile is not None
            and oom_after_compile is not None
            and oom_after_compile > oom_before_compile
        ):
            return {
                "status": "Memory Limit Exceeded",
                "tests": [],
                "runtime_ms": None,
                "error": "Compilation reached its memory limit.",
            }
        if compilation["timed_out"]:
            return {
                "status": "Time Limit Exceeded",
                "tests": [],
                "runtime_ms": None,
                "error": "Compilation exceeded its time limit.",
            }
        if compilation["output_limited"]:
            return {
                "status": "Output Limit Exceeded",
                "tests": [],
                "runtime_ms": None,
                "error": "Compiler output exceeded its size limit.",
            }
        if compilation["returncode"] != 0:
            return {
                "status": "Compilation Error",
                "tests": [],
                "runtime_ms": None,
                "error": compile_error[:output_limit] or "Compilation failed.",
            }

    case_results = []
    aggregate_runtime_ms = 0.0
    overall_status = "Accepted"
    overall_error = None
    for index, case in enumerate(tests, start=1):
        if not isinstance(case, dict):
            raise ValueError("Malformed test case.")
        case_input = case.get("input")
        expected = case.get("expected_output")
        hidden = bool(case.get("hidden", True))
        if not isinstance(case_input, str) or not isinstance(expected, str):
            raise ValueError("Malformed test case data.")

        started = time.perf_counter()
        oom_before_test = _oom_kill_count()
        result = _run_process(
            command,
            stdin_data=case_input.encode("utf-8"),
            timeout=time_limit,
            output_limit=output_limit,
            drop_privileges=True,
        )
        oom_after_test = _oom_kill_count()
        runtime_ms = (time.perf_counter() - started) * 1000
        aggregate_runtime_ms += runtime_ms
        actual_output = _text(result["stdout"])
        stderr = _text(result["stderr"]).strip()

        if (
            oom_before_test is not None
            and oom_after_test is not None
            and oom_after_test > oom_before_test
        ):
            case_status = "Memory Limit Exceeded"
        elif result["timed_out"] or result["returncode"] == -signal.SIGXCPU:
            case_status = "Time Limit Exceeded"
        elif result["output_limited"] or result["returncode"] == -signal.SIGXFSZ:
            case_status = "Output Limit Exceeded"
        elif result["returncode"] != 0:
            case_status = "Runtime Error"
        elif _normalized(actual_output) != _normalized(expected):
            case_status = "Wrong Answer"
        else:
            case_status = "Accepted"

        case_result = {"index": index, "passed": case_status == "Accepted", "runtime_ms": runtime_ms}
        if not hidden:
            case_result["actual_output"] = actual_output
            if case_status in {"Runtime Error", "Time Limit Exceeded", "Output Limit Exceeded"}:
                case_result["error"] = stderr[:output_limit] or case_status
        case_results.append(case_result)
        if report_progress is not None:
            # Progress records deliberately contain no input or output.
            # The host can still report completed tests if the container
            # itself is OOM-killed before the final record is written.
            report_progress(
                {
                    "index": index,
                    "passed": case_result["passed"],
                    "runtime_ms": runtime_ms,
                }
            )

        if case_status != "Accepted":
            overall_status = case_status
            if hidden:
                overall_error = "One or more hidden test cases failed."
            elif case_status == "Wrong Answer":
                overall_error = f"Output did not match on test case {index}."
            else:
                overall_error = stderr[:output_limit] or case_status
            break

    return {
        "status": overall_status,
        "tests": case_results,
        "runtime_ms": aggregate_runtime_ms,
        "error": overall_error,
    }


def main():
    try:
        payload = json.load(sys.stdin)
        result = run(payload, report_progress=lambda test: _emit({"event": "test", "test": test}))
        _emit({"event": "result", "result": result})
    except Exception as exc:  # A trusted wrapper failure is reported without a traceback.
        _emit({
            "event": "result",
            "result": {
                "status": "Runtime Error",
                "tests": [],
                "runtime_ms": None,
                "error": f"Sandbox runner error: {str(exc)[:1000]}",
            },
        })
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
