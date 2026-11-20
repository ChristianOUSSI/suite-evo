from functools import lru_cache

from pydantic import model_validator
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

    @model_validator(mode="after")
    def verifier_production(self):
        """Refuse de servir en production avec le secret de démonstration.

        `DEMO_MODE=False` sans `JWT_SECRET` réel laisserait n'importe qui
        forger une session : on s'arrête au démarrage plutôt que de
        découvrir la faille après.
        """
        if not self.demo_mode:
            if "dev-seulement" in self.jwt_secret or len(self.jwt_secret) < 32:
                raise ValueError(
                    "JWT_SECRET trop faible pour la production : "
                    "définir EVO_*_JWT_SECRET (32 caractères minimum)."
                )
            if not self.cookie_secure:
                import warnings

                warnings.warn(
                    "COOKIE_SECURE=False en production : le cookie de "
                    "session peut voyager en clair. Activer HTTPS et "
                    "EVO_*_COOKIE_SECURE=True.",
                    stacklevel=2,
                )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
