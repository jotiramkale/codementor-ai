"""
app/config.py

Central settings object, loaded once from environment variables (and a
local .env file via python-dotenv). Every other module that needs a
config value imports `settings` from here rather than calling
os.getenv() directly, so there's one place that knows what variables
exist and what their defaults are.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Database ---
    database_url: str = "postgresql+psycopg2://codementor:changeme@localhost:5432/codementor"

    # --- Auth ---
    jwt_secret_key: str = "replace-with-a-real-random-secret"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # --- AI ---
    groq_api_key: str | None = None

    # --- RAG ---
    chroma_persist_dir: str = "./chroma_data"

    # --- CORS ---
    frontend_origin: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    """Cached so the .env file is only parsed once per process."""
    return Settings()


settings = get_settings()
