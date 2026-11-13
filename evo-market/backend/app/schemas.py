from __future__ import annotations

import re
from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import CATEGORIES, MOYENS, STATUTS_ANNONCE, STATUTS_COMMANDE
from .utils import canonise_telephone

CATEGORIES_VALIDES = set(CATEGORIES)
STATUTS_ANNONCE_VALIDES = set(STATUTS_ANNONCE)
STATUTS_COMMANDE_VALIDES = set(STATUTS_COMMANDE)
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


class AnnonceEntree(BaseModel):
    titre: str = Field(min_length=2, max_length=200)
    categorie: str = Field(default="autre", max_length=20)
    description: str = Field(default="", max_length=3000)
    prix: int = Field(default=0, ge=0, le=100_000_000_000)
    stock: int = Field(default=1, ge=0, le=100000)
    ville: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    vendeur_nom: str = Field(default="", max_length=160)
    vendeur_telephone: str = Field(default="", max_length=24)
    note: str = Field(default="", max_length=600)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str) -> str:
        if valeur not in CATEGORIES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur

    @field_validator("vendeur_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class AnnonceCorrection(BaseModel):
    titre: str | None = Field(default=None, min_length=2, max_length=200)
    categorie: str | None = Field(default=None, max_length=20)
    description: str | None = Field(default=None, max_length=3000)
    prix: int | None = Field(default=None, ge=0, le=100_000_000_000)
    stock: int | None = Field(default=None, ge=0, le=100000)
    ville: str | None = Field(default=None, max_length=60)
    quartier: str | None = Field(default=None, max_length=80)
    statut: str | None = Field(default=None, max_length=16)
    vendeur_nom: str | None = Field(default=None, max_length=160)
    vendeur_telephone: str | None = Field(default=None, max_length=24)
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
        if valeur is not None and valeur not in STATUTS_ANNONCE_VALIDES:
            raise ValueError("liste:statut_annonce")
        return valeur

    @field_validator("vendeur_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class CommandeEntree(BaseModel):
    annonce_id: int
    quantite: int = Field(default=1, ge=1, le=10000)
    acheteur_nom: str = Field(default="", max_length=160)
    acheteur_telephone: str = Field(default="", max_length=24)
    moyen: str = Field(default="especes", max_length=20)
    date: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("acheteur_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("moyen")
    @classmethod
    def moyen_connu(cls, valeur: str) -> str:
        if valeur not in MOYENS_VALIDES:
            raise ValueError("liste:moyen")
        return valeur


class CommandeCorrection(BaseModel):
    quantite: int | None = Field(default=None, ge=1, le=10000)
    acheteur_nom: str | None = Field(default=None, max_length=160)
    acheteur_telephone: str | None = Field(default=None, max_length=24)
    moyen: str | None = Field(default=None, max_length=20)
    statut: str | None = Field(default=None, max_length=16)
    date: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("acheteur_telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)

    @field_validator("moyen")
    @classmethod
    def moyen_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in MOYENS_VALIDES:
            raise ValueError("liste:moyen")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_COMMANDE_VALIDES:
            raise ValueError("liste:statut_commande")
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
