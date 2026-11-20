from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import MOTIFS, SENS, STATUTS
from .utils import aujourdhui, canonise_telephone

MOTIFS_VALIDES = set(MOTIFS)
SENS_VALIDES = set(SENS)
STATUTS_VALIDES = set(STATUTS)


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


class AppelEntree(BaseModel):
    client_nom: str = Field(default="", max_length=160)
    client_telephone: str = Field(default="", max_length=24)
    sens: str = Field(default="entrant", max_length=10)
    motif: str = Field(default="autre", max_length=20)
    duree_secondes: int = Field(default=0, ge=0, le=86400)
    date: date_type | None = None
    date_rappel: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        if not valeur or not valeur.strip():
            return ""
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique

    @field_validator("sens")
    @classmethod
    def sens_connu(cls, valeur: str) -> str:
        if valeur not in SENS_VALIDES:
            raise ValueError("liste:sens")
        return valeur

    @field_validator("motif")
    @classmethod
    def motif_connu(cls, valeur: str) -> str:
        if valeur not in MOTIFS_VALIDES:
            raise ValueError("liste:motif")
        return valeur


class AppelCorrection(BaseModel):
    client_nom: str | None = Field(default=None, max_length=160)
    client_telephone: str | None = Field(default=None, max_length=24)
    sens: str | None = Field(default=None, max_length=10)
    motif: str | None = Field(default=None, max_length=20)
    statut: str | None = Field(default=None, max_length=16)
    agent_id: int | None = None
    duree_secondes: int | None = Field(default=None, ge=0, le=86400)
    date: date_type | None = None
    date_rappel: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        if valeur is None or not valeur.strip():
            return valeur
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique

    @field_validator("sens")
    @classmethod
    def sens_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in SENS_VALIDES:
            raise ValueError("liste:sens")
        return valeur

    @field_validator("motif")
    @classmethod
    def motif_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in MOTIFS_VALIDES:
            raise ValueError("liste:motif")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut")
        return valeur


class RappelEntree(BaseModel):
    """Le client qui demande à être rappelé, sans compte."""

    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(max_length=24)
    motif: str = Field(default="renseignement", max_length=20)
    creneau: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique

    @field_validator("motif")
    @classmethod
    def motif_connu(cls, valeur: str) -> str:
        if valeur not in MOTIFS_VALIDES:
            raise ValueError("liste:motif")
        return valeur

    @field_validator("creneau")
    @classmethod
    def creneau_valide(cls, valeur: date_type | None) -> date_type | None:
        if valeur is not None and valeur < aujourdhui():
            raise ValueError("liste:creneau")
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
