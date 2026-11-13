from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import ROLES, TYPES_CLIENT
from .utils import canonise_telephone

TYPES_VALIDES = set(TYPES_CLIENT)
STATUTS_LIVRAISON_VALIDES = {"commandee", "en_route", "livree", "annulee"}
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


class LivraisonEntree(BaseModel):
    client_id: int
    quantite: int = Field(default=1, ge=1, le=500)
    prix_unitaire: int = Field(default=0, ge=0, le=10_000_000)
    date_commande: date_type | None = None
    adresse: str = Field(default="", max_length=160)
    note: str = Field(default="", max_length=600)


class LivraisonCorrection(BaseModel):
    client_id: int | None = None
    quantite: int | None = Field(default=None, ge=1, le=500)
    prix_unitaire: int | None = Field(default=None, ge=0, le=10_000_000)
    statut: str | None = Field(default=None, max_length=12)
    date_commande: date_type | None = None
    date_livraison: date_type | None = None
    adresse: str | None = Field(default=None, max_length=160)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("statut")
    @classmethod
    def statut_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in STATUTS_LIVRAISON_VALIDES:
            raise ValueError("liste:statut_livraison")
        return valeur


class CommandePublique(BaseModel):
    """La commande passée depuis la page publique : nom, numéro, quartier, quantité."""

    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(min_length=9, max_length=24)
    quartier: str = Field(default="", max_length=80)
    quantite: int = Field(default=1, ge=1, le=100)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique


class ClientEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    telephone: str = Field(default="", max_length=24)
    quartier: str = Field(default="", max_length=80)
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


class ClientCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    telephone: str | None = Field(default=None, max_length=24)
    quartier: str | None = Field(default=None, max_length=80)
    type: str | None = Field(default=None, max_length=20)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        if valeur is None or not valeur.strip():
            return valeur
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique

    @field_validator("type")
    @classmethod
    def type_connu(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in TYPES_VALIDES:
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
