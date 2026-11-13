from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, field_validator

from .models import FREQUENCES, ROLES
from .utils import canonise_telephone

FREQUENCES_VALIDES = set(FREQUENCES)
ROLES_VALIDES = set(ROLES)


def _telephone(valeur: str) -> str:
    if not valeur or not valeur.strip():
        return ""
    canonique = canonise_telephone(valeur)
    if canonique is None:
        raise ValueError("liste:telephone")
    return canonique


class SeanceEntree(BaseModel):
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)


class GroupeEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    ville: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    frequence: str = Field(default="mensuel", max_length=12)
    jour_ancre: int = Field(default=5, ge=1, le=28)
    cotisation: int = Field(default=10_000, ge=100, le=10_000_000)
    penalite: int = Field(default=500, ge=0, le=100_000)
    telephone: str = Field(default="", max_length=24)
    mot_du_groupe: str = Field(default="", max_length=400)
    momo_actif: bool = True
    orange_actif: bool = True
    especes_actifs: bool = True

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("frequence")
    @classmethod
    def rythme_connu(cls, valeur: str) -> str:
        if valeur not in FREQUENCES_VALIDES:
            raise ValueError("liste:frequence")
        return valeur


class CompteEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="tresorier", max_length=16)

    @field_validator("role")
    @classmethod
    def role_connu(cls, valeur: str) -> str:
        if valeur not in ROLES_VALIDES:
            raise ValueError("liste:role")
        return valeur


class MembreEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    telephone: str = Field(default="", max_length=24)
    part: int = Field(default=1, ge=1, le=10)
    note: str = Field(default="", max_length=400)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class MembreCorrection(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=120)
    telephone: str | None = Field(default=None, max_length=24)
    part: int | None = Field(default=None, ge=1, le=10)
    actif: bool | None = None
    note: str | None = Field(default=None, max_length=400)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class CotisationEntree(BaseModel):
    membre_id: int
    montant: int | None = Field(default=None, ge=0, le=10_000_000)
    mode: str = Field(default="especes", max_length=16)
    jour: date | None = None


class RemiseEntree(BaseModel):
    temoin: str = Field(default="", max_length=120)
    mode: str = Field(default="especes", max_length=16)
    note: str = Field(default="", max_length=400)


class TourEntree(BaseModel):
    date_prevue: date | None = None


class TirageEntree(BaseModel):
    graine: str = Field(default="", max_length=40)


class RelanceEntree(BaseModel):
    canal: str = Field(default="whatsapp", max_length=12)
    texte: str = Field(default="", max_length=600)
