from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, field_validator

from .models import (
    ROLES,
    SEGMENTS,
    TYPES_ECHANGE,
)
from .utils import canonise_telephone

SEGMENTS_VALIDES = set(SEGMENTS)
TYPES_VALIDES = set(TYPES_ECHANGE)
ROLES_VALIDES = set(ROLES)


def _telephone(valeur: str | None, obligatoire: bool = False) -> str:
    if not valeur or not valeur.strip():
        if obligatoire:
            raise ValueError("liste:telephone")
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


class SeanceEntree(BaseModel):
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)


class EntrepriseEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    ville: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    secteur: str = Field(default="", max_length=60)
    telephone: str = Field(default="", max_length=24)
    silence_jours: int = Field(default=45, ge=7, le=365)
    rappel_jours: int = Field(default=7, ge=1, le=90)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class ClientEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    email: str = Field(default="", max_length=160)
    quartier: str = Field(default="", max_length=80)
    segment: str = Field(default="particulier", max_length=16)
    note: str = Field(default="", max_length=1000)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("segment")
    @classmethod
    def segment_connu(cls, valeur: str) -> str:
        if valeur not in SEGMENTS_VALIDES:
            raise ValueError("liste:segment")
        return valeur


class ClientCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    telephone: str | None = Field(default=None, max_length=24)
    email: str | None = Field(default=None, max_length=160)
    quartier: str | None = Field(default=None, max_length=80)
    segment: str | None = Field(default=None, max_length=16)
    note: str | None = Field(default=None, max_length=1000)
    actif: bool | None = None

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)

    @field_validator("segment")
    @classmethod
    def segment_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in SEGMENTS_VALIDES:
            raise ValueError("liste:segment")
        return valeur


class EchangeEntree(BaseModel):
    type: str = Field(default="appel", max_length=16)
    note: str = Field(default="", max_length=1000)
    montant: int = Field(default=0, ge=0, le=1_000_000_000)
    jour: date | None = None

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str) -> str:
        if valeur not in TYPES_VALIDES:
            raise ValueError("liste:type")
        return valeur


class RelanceEntree(BaseModel):
    motif: str = Field(min_length=3, max_length=240)
    due_le: date | None = None
    note: str = Field(default="", max_length=1000)


class RelanceDeplacement(BaseModel):
    due_le: date

    @field_validator("due_le")
    @classmethod
    def date_valide(cls, valeur: date) -> date:
        if valeur < date.today():
            raise ValueError("liste:relance_passee")
        return valeur


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="vendeur", max_length=16)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur
