from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="VOICE_",
        extra="ignore",
    )

    database_url: str = "sqlite:///./voice.db"
    jwt_secret: str = "dev-seulement-voice-secret-a-remplacer-32-caracteres-minimum"
    jwt_ttl_hours: int = 12
    cookie_name: str = "voice_session"
    cookie_secure: bool = False
    public_base_url: str = "http://localhost:3100"
    demo_mode: bool = True
    seed_demo: bool = True
    cors_origins: str = "http://localhost:3100,http://127.0.0.1:3100"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
