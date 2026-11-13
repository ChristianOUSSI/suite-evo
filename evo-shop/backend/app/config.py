from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="EVO_SHOP_",
        extra="ignore",
    )

    database_url: str = "sqlite:///./evoshop.db"
    jwt_secret: str = "dev-seulement-evoshop-secret-a-remplacer-32-caracteres"
    jwt_ttl_hours: int = 12
    cookie_name: str = "evo_shop_session"
    cookie_secure: bool = False
    public_base_url: str = "http://localhost:3900"
    demo_mode: bool = True
    seed_demo: bool = True
    cors_origins: str = "http://localhost:3900,http://127.0.0.1:3900"

    @property
    def origines(self) -> list[str]:
        return [un.strip() for un in self.cors_origins.split(",") if un.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
