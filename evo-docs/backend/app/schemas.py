from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import CATEGORIES, STATUTS, STATUTS_DEMANDE
from .utils import canonise_telephone

CATEGORIES_VALIDES = set(CATEGORIES)
STATUTS_VALIDES = set(STATUTS)
STATUTS_DEMANDE_VALIDES = set(STATUTS_DEMANDE)


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


class DocumentEntree(BaseModel):
    titre: str = Field(min_length=2, max_length=200)
    categorie: str = Field(default="autre", max_length=20)
    description: str = Field(default="", max_length=3000)
    emetteur: str = Field(default="", max_length=160)
    destinataire: str = Field(default="", max_length=160)
    date_document: date_type | None = None
    echeance: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str) -> str:
        if valeur not in CATEGORIES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur


class DocumentCorrection(BaseModel):
    titre: str | None = Field(default=None, min_length=2, max_length=200)
    categorie: str | None = Field(default=None, max_length=20)
    description: str | None = Field(default=None, max_length=3000)
    emetteur: str | None = Field(default=None, max_length=160)
    destinataire: str | None = Field(default=None, max_length=160)
    date_document: date_type | None = None
    echeance: date_type | None = None
    statut: str | None = Field(default=None, max_length=16)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in CATEGORIES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_VALIDES:
            raise ValueError("liste:statut")
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
    """Le citoyen qui demande un document sans compte."""

    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    categorie: str = Field(default="autre", max_length=20)
    motif: str = Field(default="", max_length=1000)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        if not valeur or not valeur.strip():
            return ""
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str) -> str:
        if valeur not in CATEGORIES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur


class DemandeCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=16)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_DEMANDE_VALIDES:
            raise ValueError("liste:statut_demande")
        return valeur
