from __future__ import annotations

import re
from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import GROUPES, MOYENS, ROLES
from .utils import canonise_telephone

ROLES_VALIDES = set(ROLES)
MOYENS_VALIDES = set(MOYENS)
GROUPES_VALIDES = set(GROUPES)


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


class PatientEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    naissance: str | None = Field(default=None, max_length=10)
    sexe: str = Field(default="", max_length=12)
    groupe: str = Field(default="", max_length=4)
    allergies: str = Field(default="", max_length=600)
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("naissance")
    @classmethod
    def forme_naissance(cls, valeur: str | None) -> str | None:
        if valeur is not None and not re.match(r"^\d{4}-\d{2}-\d{2}$", valeur):
            raise ValueError("liste:naissance")
        return valeur

    @field_validator("groupe")
    @classmethod
    def groupe_connu(cls, valeur: str) -> str:
        if valeur and valeur not in GROUPES_VALIDES:
            raise ValueError("liste:groupe")
        return valeur


class PatientCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    telephone: str | None = Field(default=None, max_length=24)
    naissance: str | None = Field(default=None, max_length=10)
    sexe: str | None = Field(default=None, max_length=12)
    groupe: str | None = Field(default=None, max_length=4)
    allergies: str | None = Field(default=None, max_length=600)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)

    @field_validator("naissance")
    @classmethod
    def forme_naissance(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur != "" and not re.match(r"^\d{4}-\d{2}-\d{2}$", valeur):
            raise ValueError("liste:naissance")
        return valeur


class ActeEntree(BaseModel):
    patient_id: int
    date: date_type | None = None
    motif: str = Field(default="", max_length=160)
    diagnostic: str = Field(default="", max_length=2000)
    traitement: str = Field(default="", max_length=2000)
    montant: int = Field(default=5000, ge=0, le=50_000_000)


class ActeCorrection(BaseModel):
    annule: bool | None = None
    motif: str | None = Field(default=None, max_length=160)
    diagnostic: str | None = Field(default=None, max_length=2000)
    traitement: str | None = Field(default=None, max_length=2000)
    montant: int | None = Field(default=None, ge=0, le=50_000_000)


class PaiementEntree(BaseModel):
    patient_id: int
    acte_id: int | None = None
    montant: int = Field(ge=500, le=50_000_000)
    moyen: str = Field(default="especes", max_length=20)
    date: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("moyen")
    @classmethod
    def moyen_connu(cls, valeur: str) -> str:
        if valeur not in MOYENS_VALIDES:
            raise ValueError("liste:moyen")
        return valeur


class PaiementCorrection(BaseModel):
    annule: bool | None = None
    note: str | None = Field(default=None, max_length=600)


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


class RendezVousEntree(BaseModel):
    """Le patient qui demande un rendez-vous, sans compte."""

    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(max_length=24)
    motif: str = Field(default="", max_length=160)
    jour: date_type
    heure: str = Field(default="", max_length=5)
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("heure")
    @classmethod
    def heure_valide(cls, valeur: str) -> str:
        if not valeur:
            return ""
        import re

        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", valeur):
            raise ValueError("heure")
        return valeur


class RendezVousCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=12)
