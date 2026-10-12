from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.execution.docker_runner import ExecutionUnavailable
from app.execution.service import ExecutionService, TestCaseInput as CaseInput


def test_execution_disabled_never_calls_runner():
    runner = Mock()
    service = ExecutionService(
        runner=runner,
        config=SimpleNamespace(
            execution_enabled=False,
            execution_max_tests=10,
            execution_max_concurrent_jobs=1,
        ),
    )
    with pytest.raises(ExecutionUnavailable, match="disabled"):
        service.execute("print(1)", "python", [CaseInput(1, "", "1", False)])
    runner.execute.assert_not_called()


def test_execution_capacity_is_released_after_runner_failure():
    config = SimpleNamespace(
        execution_enabled=True,
        execution_max_tests=10,
        execution_max_source_bytes=1024,
        execution_max_test_case_bytes=1024,
        execution_max_input_bytes=2048,
        execution_max_concurrent_jobs=1,
    )
    runner = Mock()
    runner.execute.side_effect = [RuntimeError("temporary"), SimpleNamespace(
        status="Accepted", tests=[{"passed": True}], runtime_ms=1.0, error=None
    )]
    service = ExecutionService(runner=runner, config=config)
    case = [CaseInput(1, "", "1", False)]

    with pytest.raises(RuntimeError):
        service.execute("print(1)", "python", case)
    result = service.execute("print(1)", "python", case)
    assert result.status == "Accepted"
    assert runner.execute.call_count == 2
