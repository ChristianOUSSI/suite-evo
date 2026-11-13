from __future__ import annotations

import re

from pydantic import BaseModel, Field, field_validator

from .models import ROLES, UNITES
from .utils import canonise_telephone

UNITES_VALIDES = set(UNITES)
ROLES_VALIDES = set(ROLES)


def _telephone(valeur: str | None) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


def _prix(valeur: int) -> int:
    if not 0 <= valeur <= 10_000_000:
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


class ProduitEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    unite: str = Field(default="piece", max_length=12)
    prix_achat: int = Field(default=0, ge=0)
    prix_vente: int = Field(default=0, ge=0)
    stock: int = Field(default=0, ge=0)
    seuil_alerte: int = Field(default=0, ge=0)
    note: str = Field(default="", max_length=600)

    @field_validator("unite")
    @classmethod
    def unite_connue(cls, valeur: str) -> str:
        if valeur not in UNITES_VALIDES:
            raise ValueError("liste:unite")
        return valeur


class ProduitCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    unite: str | None = Field(default=None, max_length=12)
    prix_achat: int | None = Field(default=None, ge=0)
    prix_vente: int | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    seuil_alerte: int | None = Field(default=None, ge=0)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("unite")
    @classmethod
    def unite_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in UNITES_VALIDES:
            raise ValueError("liste:unite")
        return valeur


class LigneEntree(BaseModel):
    produit_id: int
    quantite: int = Field(default=1, ge=1, le=10000)


class VenteEntree(BaseModel):
    lignes: list[LigneEntree] = Field(min_length=1, max_length=200)
    client_nom: str = Field(default="", max_length=160)
    note: str = Field(default="", max_length=600)


class VenteCorrection(BaseModel):
    statut: str | None = Field(default=None, max_length=12)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur != "annulee":
            raise ValueError("liste:statut")
        return valeur


class StockEntree(BaseModel):
    quantite: int = Field(ge=1, le=100000)
    note: str = Field(default="", max_length=600)


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="caissier", max_length=16)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur
