import unittest
from types import SimpleNamespace

from app.execution.docker_policy import build_docker_command


def settings():
    return SimpleNamespace(
        execution_docker_command="docker",
        execution_memory_mb=256,
        execution_cpu_limit=0.5,
        execution_pids_limit=32,
        execution_timeout_seconds=3.0,
        execution_compile_timeout_seconds=20.0,
        execution_output_limit_bytes=32768,
    )


class DockerPolicyTests(unittest.TestCase):
    def test_docker_command_uses_isolated_resource_limited_container(self):
        command = build_docker_command(
            settings(), "codementor-python:phase21", "codementor-job-test", "python"
        )

        self.assertEqual(command[:3], ["docker", "run", "--pull=never"])
        self.assertIn("--network=none", command)
        self.assertIn("--memory=256m", command)
        self.assertIn("--memory-swap=256m", command)
        self.assertIn("--cpus=0.5", command)
        self.assertIn("--pids-limit=32", command)
        self.assertIn("--read-only", command)
        self.assertIn("--cap-drop=ALL", command)
        self.assertIn("--cap-add=SETUID", command)
        self.assertIn("--cap-add=SETGID", command)
        self.assertIn("--cap-add=KILL", command)
        self.assertIn("--security-opt=no-new-privileges", command)
        self.assertIn("CM_LANGUAGE=python", command)
        self.assertIn("HOME=/tmp", command)
        self.assertEqual(
            command[-3:], ["codementor-python:phase21", "python3", "/opt/codementor/runner.py"]
        )

    def test_docker_command_does_not_mount_the_host_filesystem_or_network(self):
        command = build_docker_command(
            settings(), "codementor-cpp:phase21", "codementor-job-test", "cpp"
        )

        self.assertFalse(any("/var/run/docker.sock" in item for item in command))
        self.assertFalse(any(item.startswith("--volume") or item.startswith("--mount") for item in command))
        self.assertIn("--network=none", command)
