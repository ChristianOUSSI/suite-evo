from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PALABRE_",
        extra="ignore",
    )

    database_url: str = "sqlite:///./palabre.db"
    jwt_secret: str = "dev-seulement-palabre-secret-a-remplacer-32-caracteres"
    jwt_ttl_hours: int = 12
    cookie_name: str = "palabre_session"
    cookie_secure: bool = False
    public_base_url: str = "http://localhost:3000"
    demo_mode: bool = True
    seed_demo: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
