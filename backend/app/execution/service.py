"""Validate judge inputs and translate Docker results to API-level outcomes."""

import threading
from dataclasses import dataclass

from app.config import settings
from app.execution.docker_runner import DockerExecutionRunner, DockerResult, ExecutionUnavailable


class ExecutionInputError(ValueError):
    """The configured problem test data exceeds the execution contract."""


class ExecutionBusyError(RuntimeError):
    """All configured execution slots are currently in use."""


@dataclass(frozen=True)
class TestCaseInput:
    id: int
    input: str
    expected_output: str
    hidden: bool


@dataclass(frozen=True)
class ExecutionOutcome:
    status: str
    tests: list[dict]
    passed_tests: int
    total_tests: int
    runtime_ms: float | None
    error: str | None = None


class ExecutionService:
    def __init__(self, runner: DockerExecutionRunner | None = None, config=settings):
        self.runner = runner or DockerExecutionRunner(config)
        self.config = config
        self._slots = threading.BoundedSemaphore(config.execution_max_concurrent_jobs)

    def execute(self, code: str, language: str, cases: list[TestCaseInput]) -> ExecutionOutcome:
        if not self.config.execution_enabled:
            raise ExecutionUnavailable("Code execution is disabled in this deployment.")
        if not cases:
            raise ExecutionInputError("No test cases are configured for this execution.")
        if len(cases) > self.config.execution_max_tests:
            raise ExecutionInputError(
                f"This problem has more than {self.config.execution_max_tests} enabled test cases."
            )
        if len(code.encode("utf-8")) > self.config.execution_max_source_bytes:
            raise ExecutionInputError("Submitted source code exceeds the configured size limit.")

        total_input_bytes = 0
        for case in cases:
            input_bytes = len(case.input.encode("utf-8"))
            expected_bytes = len(case.expected_output.encode("utf-8"))
            if max(input_bytes, expected_bytes) > self.config.execution_max_test_case_bytes:
                raise ExecutionInputError("A configured test case exceeds the per-case size limit.")
            total_input_bytes += input_bytes + expected_bytes
        if total_input_bytes > self.config.execution_max_input_bytes:
            raise ExecutionInputError("Configured test data exceeds the total size limit.")

        if not self._slots.acquire(blocking=False):
            raise ExecutionBusyError("All execution workers are busy. Please try again shortly.")

        try:
            result: DockerResult = self.runner.execute(
                language,
                {
                    "source": code,
                    "tests": [
                        {
                            "input": case.input,
                            "expected_output": case.expected_output,
                            "hidden": case.hidden,
                        }
                        for case in cases
                    ],
                },
            )
        finally:
            self._slots.release()

        tests = result.tests
        passed = sum(bool(test.get("passed")) for test in tests)
        return ExecutionOutcome(
            status=result.status,
            tests=tests,
            passed_tests=passed,
            total_tests=len(cases),
            runtime_ms=result.runtime_ms,
            error=result.error,
        )


execution_service = ExecutionService()
