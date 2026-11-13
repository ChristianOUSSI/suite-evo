from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="EVO_CLINIC_",
        extra="ignore",
    )

    database_url: str = "sqlite:///./evoclinic.db"
    jwt_secret: str = "dev-seulement-evoclinic-secret-a-remplacer-32-caracteres"
    jwt_ttl_hours: int = 12
    cookie_name: str = "evo_clinic_session"
    cookie_secure: bool = False
    public_base_url: str = "http://localhost:4200"
    demo_mode: bool = True
    seed_demo: bool = True
    cors_origins: str = "http://localhost:4200,http://127.0.0.1:4200"

    @property
    def origines(self) -> list[str]:
        return [un.strip() for un in self.cors_origins.split(",") if un.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
