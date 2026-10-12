import pytest
from pydantic import ValidationError

from app.config import Settings
from app.schemas.auth import SignUpRequest


def test_signup_rejects_short_and_unbounded_passwords():
    base = {"name": "Student", "email": "student@example.com"}
    with pytest.raises(ValidationError):
        SignUpRequest(**base, password="short")
    with pytest.raises(ValidationError):
        SignUpRequest(**base, password="x" * 129)


def test_production_rejects_default_signing_secret():
    with pytest.raises(ValidationError, match="JWT_SECRET_KEY"):
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql+psycopg2://user:pass@db:5432/codementor",
            execution_enabled=False,
        )


def test_production_rejects_host_docker_executor():
    with pytest.raises(ValidationError, match="hardened executor"):
        Settings(
            _env_file=None,
            environment="production",
            jwt_secret_key="s" * 48,
            database_url="postgresql+psycopg2://user:pass@db:5432/codementor",
            execution_enabled=True,
        )


def test_production_accepts_explicit_safe_baseline():
    config = Settings(
        _env_file=None,
        environment="production",
        jwt_secret_key="s" * 48,
        database_url="postgresql+psycopg2://user:pass@db:5432/codementor",
        execution_enabled=False,
    )
    assert config.execution_enabled is False
