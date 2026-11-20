from __future__ import annotations

import re
from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import MOYENS, ROLES
from .utils import canonise_telephone

ROLES_VALIDES = set(ROLES)
MOYENS_VALIDES = set(MOYENS)


def _telephone(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


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
        return _telephone(valeur)


class ClasseEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=80)
    titulaire: str = Field(default="", max_length=120)
    frais_annuels: int = Field(default=50000, ge=0)
    note: str = Field(default="", max_length=600)


class ClasseCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=80)
    titulaire: str | None = Field(default=None, max_length=120)
    frais_annuels: int | None = Field(default=None, ge=0)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)


class EleveEntree(BaseModel):
    classe_id: int
    nom: str = Field(min_length=2, max_length=160)
    matricule: str = Field(default="", max_length=24)
    parent_nom: str = Field(default="", max_length=160)
    parent_telephone: str = Field(default="", max_length=24)
    frais_attendu: int | None = Field(default=None, ge=0)
    note: str = Field(default="", max_length=600)

    @field_validator("parent_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class EleveCorrection(BaseModel):
    classe_id: int | None = None
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    matricule: str | None = Field(default=None, max_length=24)
    parent_nom: str | None = Field(default=None, max_length=160)
    parent_telephone: str | None = Field(default=None, max_length=24)
    frais_attendu: int | None = Field(default=None, ge=0)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("parent_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class VersementEntree(BaseModel):
    eleve_id: int
    montant: int = Field(ge=500, le=50_000_000)
    moyen: str = Field(default="especes", max_length=20)
    date: date_type | None = None
    periode: str | None = Field(default=None, max_length=7)
    note: str = Field(default="", max_length=600)

    @field_validator("moyen")
    @classmethod
    def moyen_connu(cls, valeur: str) -> str:
        if valeur not in MOYENS_VALIDES:
            raise ValueError("liste:moyen")
        return valeur

    @field_validator("periode")
    @classmethod
    def forme_periode(cls, valeur: str | None) -> str | None:
        if valeur is not None and not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", valeur):
            raise ValueError("liste:periode")
        return valeur


class VersementCorrection(BaseModel):
    annule: bool | None = None
    note: str | None = Field(default=None, max_length=600)


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="comptable", max_length=16)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur


class DemandeEntree(BaseModel):
    """Le parent qui demande l'inscription de son enfant, sans compte."""

    eleve_nom: str = Field(min_length=2, max_length=160)
    parent_nom: str = Field(default="", max_length=160)
    telephone: str = Field(max_length=24)
    classe_id: int | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class DemandeCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=12)
