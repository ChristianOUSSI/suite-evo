from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from .utils import canonise_telephone

Mode = Literal["especes", "momo_mtn", "momo_orange", "cheque", "virement"]
Genre = Literal["maternelle", "primaire", "secondaire", "groupe"]
Role = Literal["directrice", "comptable", "surveillante"]
StatutEleve = Literal["suivi", "suspendu", "parti"]
Sexe = Literal["F", "M"]
Canal = Literal["whatsapp", "sms"]


def _telephone(valeur: str) -> str:
    if not valeur:
        return ""
    propre = canonise_telephone(valeur)
    if propre is None:
        raise ValueError("Ce numéro ne suit pas le plan camerounais.")
    return propre


class LoginIn(BaseModel):
    email: str = Field(max_length=160)
    password: str = Field(min_length=4, max_length=120)


class ClasseIn(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    niveau: int = Field(ge=1, le=13)
    salle: str = Field(default="", max_length=40)
    titulaire: str = Field(default="", max_length=120)
    effectif_max: int = Field(default=45, ge=1, le=200)
    annee: str = Field(min_length=7, max_length=12)
    scolarite: int = Field(ge=0, le=20_000_000)
    cantine: int = Field(default=0, ge=0, le=20_000_000)
    transport: int = Field(default=0, ge=0, le=20_000_000)
    autres: int = Field(default=0, ge=0, le=20_000_000)
    tranches: int = Field(default=3, ge=1, le=4)


class EleveIn(BaseModel):
    prenoms: str = Field(min_length=2, max_length=120)
    nom: str = Field(min_length=2, max_length=120)
    sexe: Sexe = "F"
    classe_id: int | None = None
    tuteur_nom: str = Field(default="", max_length=140)
    tuteur_telephone: str = Field(default="", max_length=24)
    tuteur_second: str = Field(default="", max_length=24)
    tuteur_lien: str = Field(default="parent", max_length=24)
    quartier: str = Field(default="", max_length=80)
    note: str = Field(default="", max_length=600)

    @field_validator("tuteur_telephone", "tuteur_second")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class ElevePatch(BaseModel):
    classe_id: int | None = None
    tuteur_nom: str | None = Field(default=None, max_length=140)
    tuteur_telephone: str | None = Field(default=None, max_length=24)
    tuteur_second: str | None = Field(default=None, max_length=24)
    tuteur_lien: str | None = Field(default=None, max_length=24)
    quartier: str | None = Field(default=None, max_length=80)
    statut: StatutEleve | None = None
    motif_statut: str | None = Field(default=None, max_length=160)
    note: str | None = Field(default=None, max_length=600)

    @field_validator("tuteur_telephone", "tuteur_second")
    @classmethod
    def canonise(cls, valeur: str | None) -> str | None:
        return None if valeur is None else _telephone(valeur)


class EngagementIn(BaseModel):
    eleve_id: int
    annee: str = Field(min_length=7, max_length=12)
    scolarite: int = Field(ge=0, le=20_000_000)
    cantine: int = Field(default=0, ge=0, le=20_000_000)
    transport: int = Field(default=0, ge=0, le=20_000_000)
    autres: int = Field(default=0, ge=0, le=20_000_000)
    remise: int = Field(default=0, ge=0, le=20_000_000)
    motif_remise: str = Field(default="", max_length=120)
    tranches: int = Field(default=3, ge=1, le=4)
    premiere_echeance: date | None = None


class PaiementIn(BaseModel):
    eleve_id: int
    montant: int = Field(gt=0, le=50_000_000)
    mode: Mode = "especes"
    reference: str = Field(default="", max_length=40)
    note: str = Field(default="", max_length=400)


class AnnulationIn(BaseModel):
    motif: str = Field(min_length=4, max_length=160)


class RelanceIn(BaseModel):
    eleve_id: int
    palier: int = Field(ge=0, le=9)
    canal: Canal = "whatsapp"
    corps: str = Field(min_length=6, max_length=600)


class JourneeIn(BaseModel):
    jour: date
    fond: int = Field(default=0, ge=0, le=50_000_000)
    comptage: int = Field(default=0, ge=0, le=100_000_000)
    tenu_par: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=400)


class EcoleIn(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    sigle: str = Field(default="", max_length=24)
    genre: Genre = "primaire"
    ville: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    direction: str = Field(default="", max_length=80)
    comptable: str = Field(default="", max_length=80)
    telephone: str = Field(default="", max_length=24)
    date_rentree: date
    fin_annee: date
    relance_avance: int = Field(default=7, ge=0, le=60)
    tolerance_retard: int = Field(default=21, ge=1, le=180)
    ton: Literal["courtois", "ferme"] = "courtois"
    mention_recu: str = Field(default="", max_length=400)
    whatsapp_actif: bool = True
    sms_actif: bool = False
    especes_actifs: bool = True
    momo_actif: bool = True
    orange_actif: bool = True

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)

    @field_validator("fin_annee")
    @classmethod
    def rentree_avant_fin(cls, valeur: date, info: ValidationInfo) -> date:
        debut = info.data.get("date_rentree")
        if debut and valeur <= debut:
            raise ValueError("La fin d'année vient après la rentrée.")
        return valeur


class MembreIn(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: Role = "comptable"


class EnvoiTest(BaseModel):
    canal: Canal = "whatsapp"
    a: str = Field(default="", max_length=24)
    texte: str = Field(default="", max_length=600)

    @field_validator("a")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class DateTest(BaseModel):
    a: datetime | None = None
