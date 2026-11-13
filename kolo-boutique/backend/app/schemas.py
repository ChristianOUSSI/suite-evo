from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field, field_validator

from .utils import canonise_telephone

Mode = str  # especes | momo_mtn | momo_orange | credit

CATEGORIES_DEPENSE = ("transport", "loyer", "salaire", "facture", "autre")


def _telephone(valeur: str) -> str:
    if not valeur:
        return ""
    canonical = canonise_telephone(valeur)
    if canonical is None:
        raise ValueError("Numéro camerounais attendu : 9 chiffres après +237.")
    return canonical


class SeanceEntree(BaseModel):
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)


class BoutiqueEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=160)
    enseigne: str = Field(default="", max_length=40)
    quartier: str = Field(default="", max_length=80)
    ville: str = Field(default="Douala", max_length=60)
    tenancier: str = Field(default="", max_length=80)
    telephone: str = Field(default="", max_length=24)
    abonnement_hebdo: int = Field(default=3_000, ge=0, le=100_000)
    especes_actifs: bool = True
    momo_actif: bool = True
    orange_actif: bool = True
    credit_accorde: bool = False
    note: str = Field(default="", max_length=400)

    @field_validator("telephone")
    @classmethod
    def canonise(cls, valeur: str) -> str:
        return _telephone(valeur)


class MainEntree(BaseModel):
    nom: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160)
    mot_de_passe: str = Field(min_length=6, max_length=120)
    role: str = Field(default="tenancier", max_length=24)


class ProduitEntree(BaseModel):
    nom: str = Field(min_length=1, max_length=120)
    categorie: str = Field(default="fourre-tout", max_length=60)
    unite: str = Field(default="pièce", max_length=16)
    prix_achat: int = Field(ge=0, le=10_000_000)
    prix_vente: int = Field(ge=0, le=10_000_000)
    stock: int = Field(default=0, ge=0, le=1_000_000)
    alerte_stock: int = Field(default=5, ge=0, le=10_000)
    mots_cles: str = Field(default="", max_length=240)

    @field_validator("prix_vente")
    @classmethod
    def marge_positive(cls, valeur: int, info) -> int:
        achat = info.data.get("prix_achat")
        if achat is not None and valeur < achat:
            raise ValueError("Le prix de vente ne peut pas être sous le prix d'achat.")
        return valeur


class EntreeStock(BaseModel):
    produit_id: int
    quantite: int = Field(gt=0, le=1_000_000)
    cout_unitaire: int = Field(ge=0, le=10_000_000)
    jour: date | None = None
    fournisseur: str = Field(default="", max_length=120)
    note: str = Field(default="", max_length=400)


class VenteEntree(BaseModel):
    produit_id: int
    quantite: int = Field(gt=0, le=100_000)
    prix_cede: int | None = Field(default=None, ge=0, le=10_000_000)
    mode: Mode = "especes"
    jour: date | None = None


class AnnulationEntree(BaseModel):
    motif: str = Field(min_length=4, max_length=160)


class DepenseEntree(BaseModel):
    libelle: str = Field(min_length=2, max_length=160)
    categorie: str = Field(default="autre", max_length=40)
    montant: int = Field(gt=0, le=10_000_000)
    jour: date | None = None
    note: str = Field(default="", max_length=400)

    @field_validator("categorie")
    @classmethod
    def categorie_connue(cls, valeur: str) -> str:
        if valeur not in CATEGORIES_DEPENSE:
            raise ValueError(
                "Catégorie attendue : " + ", ".join(CATEGORIES_DEPENSE) + "."
            )
        return valeur


class ComptageEntree(BaseModel):
    jour: date | None = None
    fond: int = Field(default=0, ge=0, le=10_000_000)
    compte: int = Field(ge=0, le=100_000_000)
    note: str = Field(default="", max_length=400)


class DicteeEntree(BaseModel):
    phrase: str = Field(min_length=3, max_length=600)
    jour: date | None = None
