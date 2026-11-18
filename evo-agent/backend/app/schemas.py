from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from .models import PRIORITES, TYPES_TACHE
from .utils import canonise_telephone

TYPES_VALIDES = set(TYPES_TACHE)
PRIORITES_VALIDES = set(PRIORITES)
ROLES_VALIDES = {"responsable", "agent"}
STATUTS_VALIDES = {"en_attente", "en_cours", "terminee", "echec", "annulee"}


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


class TacheEntree(BaseModel):
    titre: str = Field(min_length=2, max_length=200)
    consigne: str = Field(default="", max_length=4000)
    type: str = Field(default="autre", max_length=20)
    priorite: str = Field(default="normale", max_length=10)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str) -> str:
        if valeur not in TYPES_VALIDES:
            raise ValueError("liste:type")
        return valeur

    @field_validator("priorite")
    @classmethod
    def priorite_connue(cls, valeur: str) -> str:
        if valeur not in PRIORITES_VALIDES:
            raise ValueError("liste:priorite")
        return valeur


class TacheCorrection(BaseModel):
    titre: str | None = Field(default=None, min_length=2, max_length=200)
    consigne: str | None = Field(default=None, max_length=4000)
    type: str | None = Field(default=None, max_length=20)
    priorite: str | None = Field(default=None, max_length=10)
    statut: str | None = Field(default=None, max_length=12)
    resultat: str | None = Field(default=None, max_length=8000)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in TYPES_VALIDES:
            raise ValueError("liste:type")
        return valeur

    @field_validator("priorite")
    @classmethod
    def priorite_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in PRIORITES_VALIDES:
            raise ValueError("liste:priorite")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut_tache")
        return valeur


class CompletionEntree(BaseModel):
    """La main qui rend la tâche : résultat ou erreur."""

    resultat: str = Field(default="", max_length=8000)
    erreur: str = Field(default="", max_length=2000)


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
