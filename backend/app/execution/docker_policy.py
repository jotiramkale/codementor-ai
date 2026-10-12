"""Build the fixed Docker invocation used for every untrusted submission."""


def build_docker_command(settings, image: str, container_name: str, language: str) -> list[str]:
    """Return argv (never a shell string) for one bounded sandbox job."""
    memory = f"{settings.execution_memory_mb}m"
    return [
        settings.execution_docker_command,
        "run",
        "--pull=never",
        "--name",
        container_name,
        "--interactive",
        "--network=none",
        f"--memory={memory}",
        f"--memory-swap={memory}",
        f"--cpus={settings.execution_cpu_limit}",
        f"--pids-limit={settings.execution_pids_limit}",
        "--read-only",
        "--tmpfs=/tmp:rw,nosuid,nodev,size=64m,mode=1777",
        "--cap-drop=ALL",
        "--cap-add=SETUID",
        "--cap-add=SETGID",
        "--cap-add=KILL",
        "--security-opt=no-new-privileges",
        "--ulimit=core=0:0",
        "--env",
        f"CM_LANGUAGE={language}",
        "--env",
        "HOME=/tmp",
        "--env",
        "TMPDIR=/tmp",
        "--env",
        f"CM_TIME_LIMIT_SECONDS={settings.execution_timeout_seconds}",
        "--env",
        f"CM_COMPILE_TIMEOUT_SECONDS={settings.execution_compile_timeout_seconds}",
        "--env",
        f"CM_OUTPUT_LIMIT_BYTES={settings.execution_output_limit_bytes}",
        image,
        "python3",
        "/opt/codementor/runner.py",
    ]
