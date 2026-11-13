from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from .models import CATEGORIES, ROLES

TYPES_VALIDES = set(CATEGORIES)
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
        from .utils import canonise_telephone

        if not valeur or not valeur.strip():
            return ""
        canonique = canonise_telephone(valeur)
        if canonique is None:
            raise ValueError("liste:telephone")
        return canonique


class NoteEntree(BaseModel):
    titre: str = Field(min_length=1, max_length=160)
    contenu: str = Field(default="", max_length=8000)
    categorie: str = Field(default="perso", max_length=20)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str) -> str:
        if valeur not in TYPES_VALIDES:
            raise ValueError("liste:categorie")
        return valeur


class NoteCorrection(BaseModel):
    titre: str | None = Field(default=None, min_length=1, max_length=160)
    contenu: str | None = Field(default=None, max_length=8000)
    categorie: str | None = Field(default=None, max_length=20)
    epinglee: bool | None = None
    archivee: bool | None = None
    nouveau_code: bool | None = None

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str | None) -> str | None:
        if valeur is not None and valeur not in TYPES_VALIDES:
            raise ValueError("liste:categorie")
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
