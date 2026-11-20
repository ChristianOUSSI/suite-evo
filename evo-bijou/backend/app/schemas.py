from __future__ import annotations

from datetime import date as date_type

from pydantic import BaseModel, Field, field_validator

from .models import MATIERES, TYPES_CLIENT
from .utils import canonise_telephone

MATIERES_VALIDES = set(MATIERES)
TYPES_VALIDES = set(TYPES_CLIENT)
STATUTS_VALIDES = {"en_vitrine", "reserve", "vendu", "retire"}
CARATS_VALIDES = {None, 9, 10, 14, 18, 21, 22, 24}


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


class PieceEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    matiere: str = Field(default="or", max_length=16)
    poids_grammes: float = Field(default=0.0, ge=0, le=100000)
    carat: int | None = Field(default=None, ge=0, le=24)
    prix_achat: int = Field(default=0, ge=0, le=500_000_000)
    prix_vente: int = Field(default=0, ge=0, le=500_000_000)
    fournisseur: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=600)

    @field_validator("matiere")
    @classmethod
    def matiere_connue(cls, valeur: str) -> str:
        if valeur not in MATIERES_VALIDES:
            raise ValueError("liste:matiere")
        return valeur


class PieceCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=160)
    matiere: str | None = Field(default=None, max_length=16)
    poids_grammes: float | None = Field(default=None, ge=0, le=100000)
    carat: int | None = Field(default=None, ge=0, le=24)
    prix_achat: int | None = Field(default=None, ge=0, le=500_000_000)
    prix_vente: int | None = Field(default=None, ge=0, le=500_000_000)
    statut: str | None = Field(default=None, max_length=12)
    client_id: int | None = None
    date_vente: date_type | None = None
    fournisseur: str | None = Field(default=None, max_length=120)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("matiere")
    @classmethod
    def matiere_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in MATIERES_VALIDES:
            raise ValueError("liste:matiere")
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


class DemandeEntree(BaseModel):
    """Le client qui demande une pièce, sans compte."""

    piece_id: int | None = None
    client_nom: str = Field(min_length=2, max_length=160)
    client_telephone: str = Field(max_length=24)
    note: str = Field(default="", max_length=600)

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
