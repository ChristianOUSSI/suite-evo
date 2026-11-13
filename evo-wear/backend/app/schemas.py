from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import CATEGORIES, ROLES, TAILLES, TYPES_CLIENT
from .utils import canonise_telephone

CATEGORIES_VALIDES = set(CATEGORIES)
TAILLES_VALIDES = set(TAILLES)
TYPES_VALIDES = set(TYPES_CLIENT)
STATUTS_ARTICLE_VALIDES = {"en_stock", "vendu", "epuise"}
ROLES_VALIDES = set(ROLES)


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


class ArticleEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    categorie: str = Field(default="autre", max_length=20)
    taille: str = Field(default="unique", max_length=10)
    couleur: str = Field(default="", max_length=40)
    stock: int = Field(default=0, ge=0, le=100000)
    prix_achat: int = Field(default=0, ge=0, le=500_000_000)
    prix_vente: int = Field(default=0, ge=0, le=500_000_000)
    note: str = Field(default="", max_length=600)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str) -> str:
        if valeur not in CATEGORIES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur

    @field_validator("taille")
    @classmethod
    def taille_connue(cls, valeur: str) -> str:
        if valeur not in TAILLES_VALIDES:
            raise ValueError("liste:taille")
        return valeur


class ArticleCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    categorie: str | None = Field(default=None, max_length=20)
    taille: str | None = Field(default=None, max_length=10)
    couleur: str | None = Field(default=None, max_length=40)
    stock: int | None = Field(default=None, ge=0, le=100000)
    prix_achat: int | None = Field(default=None, ge=0, le=500_000_000)
    prix_vente: int | None = Field(default=None, ge=0, le=500_000_000)
    statut: str | None = Field(default=None, max_length=12)
    quantite_vendue: int | None = Field(default=None, ge=0, le=100000)
    client_id: int | None = None
    date_vente: date_type | None = None
    note: str | None = Field(default=None, max_length=600)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in CATEGORIES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur

    @field_validator("taille")
    @classmethod
    def taille_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in TAILLES_VALIDES:
            raise ValueError("liste:taille")
        return valeur

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_ARTICLE_VALIDES:
            raise ValueError("liste:statut_article")
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
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur
