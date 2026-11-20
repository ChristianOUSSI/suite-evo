from __future__ import annotations

import re
from datetime import date

from pydantic import BaseModel, Field, field_validator

from .models import ETATS, ROLES
from .security import ALPHABET
from .utils import canonise_telephone

ETATS_VALIDES = set(ETATS)
ROLES_VALIDES = set(ROLES)
FORME_PERIODE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
FORME_HEURE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


def _telephone(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


def _heure(valeur: str | None) -> str:
    if not valeur:
        return ""
    texte = valeur.strip()
    if not FORME_HEURE.match(texte):
        raise ValueError("liste:heure")
    return texte


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


class EmployeEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    service: str = Field(default="", max_length=60)
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class EmployeCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    telephone: str | None = Field(default=None, max_length=24)
    service: str | None = Field(default=None, max_length=60)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class PresenceEntree(BaseModel):
    employe_id: int
    jour: date
    statut: str = Field(default="present", max_length=12)
    arrivee: str = Field(default="", max_length=5)
    depart: str = Field(default="", max_length=5)
    note: str = Field(default="", max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str) -> str:
        if valeur not in ETATS_VALIDES:
            raise ValueError("liste:statut")
        return valeur

    @field_validator("arrivee", "depart")
    @classmethod
    def heure_valide(cls, valeur: str) -> str:
        return _heure(valeur)


class PresenceCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=12)
    arrivee: str | None = Field(default=None, max_length=5)
    depart: str | None = Field(default=None, max_length=5)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in ETATS_VALIDES:
            raise ValueError("liste:statut")
        return valeur

    @field_validator("arrivee", "depart")
    @classmethod
    def heure_valide(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _heure(valeur)


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


GESTES = ("arrivee", "depart")


class PointageKiosque(BaseModel):
    """Le pointage de l'écran partagé : un code, un geste, une heure."""

    code: str = Field(min_length=8, max_length=8)
    geste: str = Field(default="arrivee", max_length=8)
    heure: str = Field(default="", max_length=5)

    @field_validator("code")
    @classmethod
    def code_propre(cls, valeur: str) -> str:
        propre = valeur.strip().upper()
        if any(un not in ALPHABET for un in propre):
            raise ValueError("liste:code_pointage")
        return propre

    @field_validator("geste")
    @classmethod
    def geste_connu(cls, valeur: str) -> str:
        if valeur not in GESTES:
            raise ValueError("liste:geste")
        return valeur

    @field_validator("heure")
    @classmethod
    def heure_valide(cls, valeur: str) -> str:
        if not valeur:
            return ""
        return _heure(valeur)
