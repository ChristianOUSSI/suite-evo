from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import STATUTS_MOTO, STATUTS_REPARATION, TYPES_CLIENT
from .utils import canonise_telephone

TYPES_VALIDES = set(TYPES_CLIENT)
STATUTS_MOTO_VALIDES = set(STATUTS_MOTO)
STATUTS_REPARATION_VALIDES = set(STATUTS_REPARATION)


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


class MotoEntree(BaseModel):
    marque: str = Field(min_length=2, max_length=60)
    modele: str = Field(min_length=1, max_length=80)
    annee: int = Field(ge=1990, le=2100)
    kilometrage: int = Field(default=0, ge=0, le=500_000)
    couleur: str = Field(default="", max_length=40)
    prix: int = Field(ge=0, le=500_000_000)
    note: str = Field(default="", max_length=600)


class MotoCorrection(BaseModel):
    marque: str | None = Field(default=None, min_length=2, max_length=60)
    modele: str | None = Field(default=None, min_length=1, max_length=80)
    annee: int | None = Field(default=None, ge=1990, le=2100)
    kilometrage: int | None = Field(default=None, ge=0, le=500_000)
    couleur: str | None = Field(default=None, max_length=40)
    prix: int | None = Field(default=None, ge=0, le=500_000_000)
    statut: str | None = Field(default=None, max_length=12)
    client_id: int | None = None
    date_vente: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_MOTO_VALIDES:
            raise ValueError("liste:statut_moto")
        return valeur


class ReparationEntree(BaseModel):
    client_id: int
    moto_id: int | None = None
    immatriculation: str = Field(default="", max_length=20)
    panne: str = Field(min_length=2, max_length=160)
    travaux: str = Field(default="", max_length=1000)
    cout_main_oeuvre: int = Field(default=0, ge=0, le=100_000_000)
    cout_pieces: int = Field(default=0, ge=0, le=100_000_000)
    date_reception: date_type | None = None
    note: str = Field(default="", max_length=600)


class ReparationCorrection(BaseModel):
    panne: str | None = Field(default=None, min_length=2, max_length=160)
    travaux: str | None = Field(default=None, max_length=1000)
    cout_main_oeuvre: int | None = Field(default=None, ge=0, le=100_000_000)
    cout_pieces: int | None = Field(default=None, ge=0, le=100_000_000)
    statut: str | None = Field(default=None, max_length=12)
    immatriculation: str | None = Field(default=None, max_length=20)
    moto_id: int | None = None
    date_livraison: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_REPARATION_VALIDES:
            raise ValueError("liste:statut_reparation")
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
    """Le client qui écrit depuis le catalogue, sans compte."""

    type: str = Field(default="moto", max_length=12)
    moto_id: int | None = None
    client_nom: str = Field(min_length=2, max_length=160)
    client_telephone: str = Field(max_length=24)
    description: str = Field(default="", max_length=400)
    note: str = Field(default="", max_length=600)

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str) -> str:
        if valeur not in ("moto", "reparation"):
            raise ValueError("liste:type")
        return valeur

    @field_validator("client_telephone")
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
