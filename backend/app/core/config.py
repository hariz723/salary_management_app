import os

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )

    PROJECT_NAME: str = "Salary Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://salary_user:salary_password@db:5432/salary_db",
    )
    HUGGINGFACE_API_TOKEN: str | None = Field(
        default=None,
        validation_alias=AliasChoices("HUGGINGFACE_API_TOKEN", "HF_TOKEN"),
    )
    HUGGINGFACE_MODEL: str = "Qwen/Qwen2.5-7B-Instruct-1M:fastest"
    HUGGINGFACE_API_URL: str = "https://router.huggingface.co/v1/chat/completions"
    HUGGINGFACE_TIMEOUT_SECONDS: float = 20
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()
