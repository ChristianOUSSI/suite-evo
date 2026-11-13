from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import BOITES, CARBURANTS, TYPES_CLIENT
from .utils import canonise_telephone

CARBURANTS_VALIDES = set(CARBURANTS)
BOITES_VALIDES = set(BOITES)
TYPES_VALIDES = set(TYPES_CLIENT)
STATUTS_VALIDES = {"en_vente", "reserve", "vendu", "retire"}


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


class VehiculeEntree(BaseModel):
    marque: str = Field(min_length=2, max_length=60)
    modele: str = Field(min_length=1, max_length=80)
    annee: int = Field(ge=1980, le=2100)
    kilometrage: int = Field(default=0, ge=0, le=2_000_000)
    carburant: str = Field(default="essence", max_length=12)
    boite: str = Field(default="manuelle", max_length=12)
    prix: int = Field(ge=0, le=500_000_000)
    note: str = Field(default="", max_length=600)

    @field_validator("carburant")
    @classmethod
    def carburant_connu(cls, valeur: str) -> str:
        if valeur not in CARBURANTS_VALIDES:
            raise ValueError("liste:carburant")
        return valeur

    @field_validator("boite")
    @classmethod
    def boite_connue(cls, valeur: str) -> str:
        if valeur not in BOITES_VALIDES:
            raise ValueError("liste:boite")
        return valeur


class VehiculeCorrection(BaseModel):
    marque: str | None = Field(default=None, min_length=2, max_length=60)
    modele: str | None = Field(default=None, min_length=1, max_length=80)
    annee: int | None = Field(default=None, ge=1980, le=2100)
    kilometrage: int | None = Field(default=None, ge=0, le=2_000_000)
    carburant: str | None = Field(default=None, max_length=12)
    boite: str | None = Field(default=None, max_length=12)
    prix: int | None = Field(default=None, ge=0, le=500_000_000)
    statut: str | None = Field(default=None, max_length=12)
    client_id: int | None = None
    date_vente: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("carburant")
    @classmethod
    def carburant_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in CARBURANTS_VALIDES:
            raise ValueError("liste:carburant")
        return valeur

    @field_validator("boite")
    @classmethod
    def boite_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in BOITES_VALIDES:
            raise ValueError("liste:boite")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
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
