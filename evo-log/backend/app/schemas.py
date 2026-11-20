from __future__ import annotations

import re
from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import GENRES, MOYENS, STATUTS, VILLES
from .utils import canonise_telephone

GENRES_VALIDES = set(GENRES)
STATUTS_VALIDES = set(STATUTS)
MOYENS_VALIDES = set(MOYENS)
VILLES_VALIDES = set(VILLES)


def _telephone(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


def _ville(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return "Douala"
    ville = valeur.strip()
    if ville not in VILLES_VALIDES:
        raise ValueError("liste:ville")
    return ville


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


class ColisEntree(BaseModel):
    genre: str = Field(default="colis", max_length=20)
    description: str = Field(default="", max_length=2000)
    poids_kg: int = Field(default=0, ge=0, le=5000)

    expediteur_nom: str = Field(default="", max_length=160)
    expediteur_telephone: str = Field(default="", max_length=24)

    destinataire_nom: str = Field(default="", max_length=160)
    destinataire_telephone: str = Field(default="", max_length=24)

    depart: str = Field(default="Douala", max_length=60)
    arrivee: str = Field(default="Douala", max_length=60)

    frais: int = Field(default=0, ge=0, le=10_000_000)
    moyen: str = Field(default="a_payer", max_length=20)
    date_depot: date_type | None = None
    note: str = Field(default="", max_length=600)

    @field_validator("genre")
    @classmethod
    def genre_connu(cls, valeur: str) -> str:
        if valeur not in GENRES_VALIDES:
            raise ValueError("liste:genre")
        return valeur

    @field_validator("depart", "arrivee")
    @classmethod
    def ville_connue(cls, valeur: str) -> str:
        return _ville(valeur)

    @field_validator("expediteur_telephone", "destinataire_telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("moyen")
    @classmethod
    def moyen_connu(cls, valeur: str) -> str:
        if valeur not in MOYENS_VALIDES:
            raise ValueError("liste:moyen")
        return valeur


class ColisCorrection(BaseModel):
    genre: str | None = Field(default=None, max_length=20)
    description: str | None = Field(default=None, max_length=2000)
    poids_kg: int | None = Field(default=None, ge=0, le=5000)
    expediteur_nom: str | None = Field(default=None, max_length=160)
    expediteur_telephone: str | None = Field(default=None, max_length=24)
    destinataire_nom: str | None = Field(default=None, max_length=160)
    destinataire_telephone: str | None = Field(default=None, max_length=24)
    depart: str | None = Field(default=None, max_length=60)
    arrivee: str | None = Field(default=None, max_length=60)
    frais: int | None = Field(default=None, ge=0, le=10_000_000)
    moyen: str | None = Field(default=None, max_length=20)
    statut: str | None = Field(default=None, max_length=16)
    date_depot: date_type | None = None
    date_livraison: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("genre")
    @classmethod
    def genre_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in GENRES_VALIDES:
            raise ValueError("liste:genre")
        return valeur

    @field_validator("depart", "arrivee")
    @classmethod
    def ville_connue(cls, valeur: str | None) -> str | None:
        if valeur is None:
            return None
        return _ville(valeur)

    @field_validator("expediteur_telephone", "destinataire_telephone")
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


class DemandeEnvoiEntree(BaseModel):
    """L'expéditeur qui demande un envoi, sans compte."""

    genre: str = Field(default="colis", max_length=20)
    description: str = Field(default="", max_length=2000)
    poids_kg: int = Field(default=0, ge=0, le=5000)
    expediteur_nom: str = Field(min_length=2, max_length=160)
    expediteur_telephone: str = Field(max_length=24)
    destinataire_nom: str = Field(min_length=2, max_length=160)
    destinataire_telephone: str = Field(max_length=24)
    depart: str = Field(default="Douala", max_length=60)
    arrivee: str = Field(default="Douala", max_length=60)
    note: str = Field(default="", max_length=600)

    @field_validator("genre")
    @classmethod
    def genre_connu(cls, valeur: str) -> str:
        if valeur not in GENRES_VALIDES:
            raise ValueError("liste:genre")
        return valeur

    @field_validator("expediteur_telephone", "destinataire_telephone")
    @classmethod
    def telephones(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("depart", "arrivee")
    @classmethod
    def ville_connue(cls, valeur: str) -> str:
        return _ville(valeur)


class DemandeCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=12)
