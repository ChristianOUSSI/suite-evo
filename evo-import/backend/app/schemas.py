from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import MODES, STATUTS_ENVOI, TYPES_CLIENT
from .utils import canonise_telephone

MODES_VALIDES = set(MODES)
STATUTS_VALIDES = set(STATUTS_ENVOI)
TYPES_VALIDES = set(TYPES_CLIENT)


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


class EnvoiEntree(BaseModel):
    description: str = Field(min_length=2, max_length=200)
    mode: str = Field(default="maritime", max_length=12)
    expéditeur_nom: str = Field(default="", max_length=160)
    expéditeur_pays: str = Field(default="", max_length=60)
    destinataire_nom: str = Field(default="", max_length=160)
    destinataire_ville: str = Field(default="", max_length=80)
    poids_kg: float = Field(default=0, ge=0, le=100000)
    valeur_declaree: int = Field(default=0, ge=0, le=10_000_000_000)
    frais: int = Field(default=0, ge=0, le=10_000_000_000)
    client_id: int | None = None
    date_envoi: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("mode")
    @classmethod
    def mode_connu(cls, valeur: str) -> str:
        if valeur not in MODES_VALIDES:
            raise ValueError("liste:mode")
        return valeur


class SuiviEntree(BaseModel):
    statut: str = Field(max_length=12)
    note: str = Field(default="", max_length=300)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str) -> str:
        if valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut")
        return valeur


class ClientEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    type: str = Field(default="particulier", max_length=20)
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        if not valeur or not valeur.strip():
            return ""
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str) -> str:
        if valeur not in TYPES_VALIDES:
            raise ValueError("liste:type")
        return valeur


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="agent", max_length=16)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in {"responsable", "agent"}:
            raise ValueError("liste:role")
        return valeur


class DemandeEntree(BaseModel):
    """Le client qui demande un devis de transport, sans compte."""

    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(max_length=24)
    description: str = Field(min_length=2, max_length=200)
    mode: str = Field(default="maritime", max_length=12)
    expediteur_pays: str = Field(default="", max_length=60)
    destinataire_ville: str = Field(default="", max_length=80)
    poids_kg: float = Field(default=0, ge=0, le=100000)
    valeur_declaree: int = Field(default=0, ge=0, le=10_000_000_000)
    note: str = Field(default="", max_length=600)

    @field_validator("mode")
    @classmethod
    def mode_connu(cls, valeur: str) -> str:
        if valeur not in MODES_VALIDES:
            raise ValueError("liste:mode")
        return valeur

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        if not valeur or not valeur.strip():
            return ""
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique


class DemandeCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=12)
    note: str | None = Field(default=None, max_length=600)
