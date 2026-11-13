from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="CASH_",
        extra="ignore",
    )

    database_url: str = "sqlite:///./ecole_cash.db"
    jwt_secret: str = "dev-seulement-ecolecash-secret-a-remplacer-32-caracteres-mini"
    jwt_ttl_hours: int = 10
    cookie_name: str = "cash_session"
    cookie_secure: bool = False
    public_base_url: str = "http://localhost:3200"
    demo_mode: bool = True
    seed_demo: bool = True
    cors_origins: str = "http://localhost:3200,http://127.0.0.1:3200"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
