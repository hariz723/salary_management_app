import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )

    PROJECT_NAME: str = "ACME Salary Management System"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://acme_user:acme_password@db:5432/salary_db",
    )
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]


settings = Settings()
