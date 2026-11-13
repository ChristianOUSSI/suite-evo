from __future__ import annotations

import re
from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import CANAUX, ISSUES, STATUTS, STATUTS_DEMANDE, TYPES
from .utils import canonise_telephone

TYPES_VALIDES = set(TYPES)
STATUTS_VALIDES = set(STATUTS)
CANAUX_VALIDES = set(CANAUX)
STATUTS_DEMANDE_VALIDES = set(STATUTS_DEMANDE)
ISSUES_VALIDES = set(ISSUES)


def _telephone(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


def _heure(valeur: str | None) -> str:
    if valeur is None or valeur == "":
        return "10:00"
    if not re.match(r"^([01]\d|2[0-3]):[0-5]\d$", valeur):
        raise ValueError("liste:heure")
    return valeur


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


class BienEntree(BaseModel):
    type: str = Field(default="appartement", max_length=20)
    titre: str = Field(default="", max_length=160)
    ville: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    prix: int = Field(default=0, ge=0, le=50_000_000_000)
    surface_m2: int = Field(default=0, ge=0, le=100000)
    chambres: int = Field(default=0, ge=0, le=50)
    description: str = Field(default="", max_length=3000)
    proprietaire_nom: str = Field(default="", max_length=160)
    proprietaire_telephone: str = Field(default="", max_length=24)
    agent_id: int | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str) -> str:
        if valeur not in TYPES_VALIDES:
            raise ValueError("liste:type")
        return valeur

    @field_validator("proprietaire_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class BienCorrection(BaseModel):
    type: str | None = Field(default=None, max_length=20)
    titre: str | None = Field(default=None, max_length=160)
    ville: str | None = Field(default=None, max_length=60)
    quartier: str | None = Field(default=None, max_length=80)
    prix: int | None = Field(default=None, ge=0, le=50_000_000_000)
    surface_m2: int | None = Field(default=None, ge=0, le=100000)
    chambres: int | None = Field(default=None, ge=0, le=50)
    description: str | None = Field(default=None, max_length=3000)
    statut: str | None = Field(default=None, max_length=16)
    proprietaire_nom: str | None = Field(default=None, max_length=160)
    proprietaire_telephone: str | None = Field(default=None, max_length=24)
    agent_id: int | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in TYPES_VALIDES:
            raise ValueError("liste:type")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut")
        return valeur

    @field_validator("proprietaire_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class DemandeEntree(BaseModel):
    bien_id: int | None = None
    client_nom: str = Field(default="", max_length=160)
    client_telephone: str = Field(default="", max_length=24)
    canal: str = Field(default="telephone", max_length=24)
    message: str = Field(default="", max_length=2000)
    date: date_type | None = None
    statut: str = Field(default="nouvelle", max_length=16)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("canal")
    @classmethod
    def canal_connu(cls, valeur: str) -> str:
        if valeur not in CANAUX_VALIDES:
            raise ValueError("liste:canal")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str) -> str:
        if valeur not in STATUTS_DEMANDE_VALIDES:
            raise ValueError("liste:statut_demande")
        return valeur


class DemandeCorrection(BaseModel):
    bien_id: int | None = None
    client_nom: str | None = Field(default=None, max_length=160)
    client_telephone: str | None = Field(default=None, max_length=24)
    canal: str | None = Field(default=None, max_length=24)
    message: str | None = Field(default=None, max_length=2000)
    statut: str | None = Field(default=None, max_length=16)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_DEMANDE_VALIDES:
            raise ValueError("liste:statut_demande")
        return valeur


class VisiteEntree(BaseModel):
    bien_id: int
    date: date_type | None = None
    heure: str = Field(default="10:00", max_length=5)
    client_nom: str = Field(default="", max_length=160)
    client_telephone: str = Field(default="", max_length=24)
    issue: str = Field(default="a_venir", max_length=12)
    note: str = Field(default="", max_length=600)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("heure")
    @classmethod
    def forme_heure(cls, valeur: str) -> str:
        return _heure(valeur)

    @field_validator("issue")
    @classmethod
    def issue_connue(cls, valeur: str) -> str:
        if valeur not in ISSUES_VALIDES:
            raise ValueError("liste:issue")
        return valeur


class VisiteCorrection(BaseModel):
    date: date_type | None = None
    heure: str | None = Field(default=None, max_length=5)
    client_nom: str | None = Field(default=None, max_length=160)
    client_telephone: str | None = Field(default=None, max_length=24)
    issue: str | None = Field(default=None, max_length=12)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)

    @field_validator("heure")
    @classmethod
    def forme_heure(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _heure(valeur)

    @field_validator("issue")
    @classmethod
    def issue_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in ISSUES_VALIDES:
            raise ValueError("liste:issue")
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
