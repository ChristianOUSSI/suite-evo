from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from .models import INTENTIONS, STATUTS_COMMANDE
from .utils import canonise_telephone

INTENTIONS_VALIDES = set(INTENTIONS)
ROLES_VALIDES = {"responsable", "agent"}
STATUTS_VALIDES = set(STATUTS_COMMANDE)


class SeanceEntree(BaseModel):
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)


class OrganisationEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    ville: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    telephone: str = Field(default="", max_length=24)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        if not valeur or not valeur.strip():
            return ""
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique


class CommandeEntree(BaseModel):
    """Ce qui a été dit, tel que la dictée l'a rendu."""

    transcription: str = Field(min_length=3, max_length=2000)


class CommandeCorrection(BaseModel):
    transcription: str | None = Field(default=None, min_length=3, max_length=2000)
    intention: str | None = Field(default=None, max_length=16)
    statut: str | None = Field(default=None, max_length=12)

    @field_validator("intention")
    @classmethod
    def intention_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in INTENTIONS_VALIDES:
            raise ValueError("liste:intention")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut_commande")
        return valeur


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="agent", max_length=16)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur
