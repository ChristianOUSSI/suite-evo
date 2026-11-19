from __future__ import annotations

import re
from datetime import date

from pydantic import BaseModel, Field, field_validator

from .models import ROLES, STATUTS, TYPES_CHAMBRE
from .utils import canonise_telephone

TYPES_VALIDES = set(TYPES_CHAMBRE)
STATUTS_VALIDES = set(STATUTS)
ROLES_VALIDES = set(ROLES)
FORME_PERIODE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _telephone(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


def _prix(valeur: int) -> int:
    if not 0 <= valeur <= 5_000_000:
        raise ValueError("liste:prix")
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


class ChambreEntree(BaseModel):
    numero: str = Field(min_length=1, max_length=12)
    type: str = Field(default="standard", max_length=20)
    prix_par_nuit: int = Field(default=15000, ge=0)
    capacite: int = Field(default=2, ge=1, le=10)
    note: str = Field(default="", max_length=600)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str) -> str:
        if valeur not in TYPES_VALIDES:
            raise ValueError("liste:type_chambre")
        return valeur


class ChambreCorrection(BaseModel):
    numero: str | None = Field(default=None, min_length=1, max_length=12)
    type: str | None = Field(default=None, max_length=20)
    prix_par_nuit: int | None = Field(default=None, ge=0)
    capacite: int | None = Field(default=None, ge=1, le=10)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in TYPES_VALIDES:
            raise ValueError("liste:type_chambre")
        return valeur


class ClientEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    piece: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class ClientCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    telephone: str | None = Field(default=None, max_length=24)
    piece: str | None = Field(default=None, max_length=120)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class SejourEntree(BaseModel):
    chambre_id: int
    client_id: int | None = None
    client_nom: str = Field(default="", max_length=160)
    client_telephone: str = Field(default="", max_length=24)
    arrivee: date
    depart: date
    note: str = Field(default="", max_length=600)

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class SejourCorrection(BaseModel):
    arrivee: date | None = None
    depart: date | None = None
    statut: str | None = Field(default=None, max_length=12)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut")
        return valeur


class ReservationPublique(BaseModel):
    """Ce que le visiteur de la page publique envoie : des dates, un type
    de chambre souhaité, et comment le rappeler."""

    arrivee: date
    depart: date
    type_chambre: str = Field(default="", max_length=20)
    client_nom: str = Field(min_length=2, max_length=160)
    client_telephone: str = Field(default="", max_length=24)
    note: str = Field(default="", max_length=600)

    @field_validator("type_chambre")
    @classmethod
    def type_optionnel(cls, valeur: str) -> str:
        if valeur and valeur not in TYPES_VALIDES:
            raise ValueError("liste:type_chambre")
        return valeur

    @field_validator("client_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="receptionniste", max_length=20)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur
