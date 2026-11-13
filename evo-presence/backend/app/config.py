from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="EVO_PRESENCE_",
        extra="ignore",
    )

    database_url: str = "sqlite:///./evopresence.db"
    jwt_secret: str = "dev-seulement-evopresence-secret-a-remplacer-32-caracteres"
    jwt_ttl_hours: int = 12
    cookie_name: str = "evo_presence_session"
    cookie_secure: bool = False
    public_base_url: str = "http://localhost:3700"
    demo_mode: bool = True
    seed_demo: bool = True
    cors_origins: str = "http://localhost:3700,http://127.0.0.1:3700"

    @property
    def origines(self) -> list[str]:
        return [un.strip() for un in self.cors_origins.split(",") if un.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
