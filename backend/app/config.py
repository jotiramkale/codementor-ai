"""
app/config.py

Central settings object, loaded once from environment variables (and a
local .env file via python-dotenv). Every other module that needs a
config value imports `settings` from here rather than calling
os.getenv() directly, so there's one place that knows what variables
exist and what their defaults are.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = Field(default="development", pattern="^(development|test|staging|production)$")

    # --- Database ---
    database_url: str = "postgresql+psycopg2://codementor:changeme@localhost:5432/codementor"

    @field_validator("database_url", mode="before")
    @classmethod
    def use_installed_postgres_driver(cls, value):
        # requirements.txt installs psycopg2-binary; SQLAlchemy's generic
        # postgresql:// URL otherwise selects psycopg (v3) by default.
        if isinstance(value, str):
            if value.startswith("postgresql://"):
                return value.replace("postgresql://", "postgresql+psycopg2://", 1)
            if value.startswith("postgres://"):
                return value.replace("postgres://", "postgresql+psycopg2://", 1)
        return value

    # --- Auth ---
    jwt_secret_key: str = "development-only-change-this-secret-before-deploying"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # --- AI ---
    groq_api_key: str | None = None
    groq_model: str = "openai/gpt-oss-120b"
    groq_timeout_seconds: float = Field(default=45.0, gt=0, le=180)
    groq_max_completion_tokens: int = Field(default=1600, ge=128, le=8192)
    groq_reasoning_effort: str = Field(default="low", pattern="^(low|medium|high)$")

    # --- RAG ---
    chroma_persist_dir: str = "./chroma_data"
    rag_collection_name: str = "codementor_knowledge"
    rag_memory_collection_name: str = "codementor_user_memory"
    rag_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    rag_chunk_chars: int = Field(default=1200, ge=400, le=3000)
    rag_top_k: int = Field(default=3, ge=1, le=10)
    rag_min_similarity: float = Field(default=0.15, ge=0, le=1)
    rag_max_context_chars: int = Field(default=12000, ge=1000, le=50000)

    # --- Isolated code execution (Phase 21) ---
    execution_docker_command: str = "docker"
    execution_enabled: bool = True
    execution_python_image: str = "codementor-python:phase21"
    execution_javascript_image: str = "codementor-javascript:phase21"
    execution_java_image: str = "codementor-java:phase21"
    execution_cpp_image: str = "codementor-cpp:phase21"
    execution_timeout_seconds: float = Field(default=3.0, gt=0, le=30)
    execution_compile_timeout_seconds: float = Field(default=20.0, gt=0, le=60)
    execution_job_timeout_seconds: float = Field(default=180.0, gt=0, le=600)
    execution_memory_mb: int = Field(default=256, ge=128, le=2048)
    execution_cpu_limit: float = Field(default=0.5, gt=0, le=4)
    execution_pids_limit: int = Field(default=32, ge=4, le=256)
    execution_output_limit_bytes: int = Field(default=32768, ge=1024, le=1048576)
    execution_max_source_bytes: int = Field(default=262144, ge=1024, le=1048576)
    execution_max_test_case_bytes: int = Field(default=32768, ge=1024, le=1048576)
    execution_max_input_bytes: int = Field(default=1048576, ge=1024, le=10485760)
    execution_max_tests: int = Field(default=50, ge=1, le=50)
    execution_max_concurrent_jobs: int = Field(default=2, ge=1, le=32)

    # --- CORS ---
    frontend_origin: str = "http://localhost:5173,http://127.0.0.1:5173"

    @model_validator(mode="after")
    def validate_production_configuration(self):
        if self.environment == "production":
            if len(self.jwt_secret_key) < 32 or self.jwt_secret_key.startswith("development-only"):
                raise ValueError("Production requires a unique JWT_SECRET_KEY with at least 32 characters.")
            if "changeme" in self.database_url.lower() or "localhost" in self.database_url.lower():
                raise ValueError("Production requires an explicit non-local DATABASE_URL.")
            if self.execution_enabled:
                raise ValueError(
                    "Production code execution requires a separately hardened executor; set EXECUTION_ENABLED=false."
                )
        return self


@lru_cache
def get_settings() -> Settings:
    """Cached so the .env file is only parsed once per process."""
    return Settings()


settings = get_settings()
