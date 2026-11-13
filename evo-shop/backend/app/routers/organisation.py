from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Produit, User
from ..schemas import (
    CompteEntree,
    OrganisationEntree,
    ProduitCorrection,
    ProduitEntree,
    StockEntree,
)
from ..security import hash_password
from ..services import present

router = APIRouter(tags=["maison"])


@router.get("/organisation")
def lecture(organisation: OrganisationCourante) -> dict:
    return present.organisation_dict(organisation)


@router.put("/organisation")
def ecrire(
    entree: OrganisationEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    organisation.nom = entree.nom.strip()
    organisation.ville = entree.ville.strip()
    organisation.quartier = entree.quartier.strip()
    organisation.telephone = entree.telephone
    db.commit()
    return present.organisation_dict(organisation)


@router.get("/comptes")
def comptes(organisation: OrganisationCourante, db: DbSession) -> list[dict]:
    lignes = db.scalars(
        select(User).where(User.organisation_id == organisation.id).order_by(User.nom)
    ).all()
    return [present.compte_dict(un) for un in lignes]


@router.post("/comptes")
def ajouter_compte(
    entree: CompteEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    email = entree.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise refus("adresse_prise")
    nouveau = User(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        email=email,
        mot_de_passe=hash_password(entree.mot_de_passe),
        role=entree.role,
    )
    db.add(nouveau)
    db.commit()
    return present.compte_dict(nouveau)


@router.get("/produits")
def produits(organisation: OrganisationCourante, db: DbSession) -> dict:
    lignes = db.scalars(
        select(Produit)
        .where(Produit.organisation_id == organisation.id)
        .order_by(Produit.nom)
    ).all()
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un.actif),
        "produits": [present.produit_dict(un) for un in lignes],
    }


@router.post("/produits")
def ajouter_produit(
    entree: ProduitEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    nom = entree.nom.strip()
    prise = db.scalar(
        select(Produit.id).where(
            Produit.organisation_id == organisation.id,
            Produit.nom == nom,
        )
    )
    if prise is not None:
        raise refus("nom_pris")
    produit = Produit(
        organisation_id=organisation.id,
        nom=nom,
        unite=entree.unite,
        prix_achat=entree.prix_achat,
        prix_vente=entree.prix_vente,
        stock=entree.stock,
        seuil_alerte=entree.seuil_alerte,
        note=entree.note.strip(),
    )
    db.add(produit)
    db.commit()
    return present.produit_dict(produit)


@router.patch("/produits/{produit_id}")
def corriger_produit(
    produit_id: int,
    entree: ProduitCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Prix, stock et fiche : le responsable seul. Le stock ne se règle pas
    ici — il bouge à la vente, à l'annulation et au réapprovisionnement."""
    from ..services import shop

    produit = shop.produit_de(db, organisation, produit_id)
    if compte.role != "responsable" and (
        entree.prix_achat is not None
        or entree.prix_vente is not None
        or entree.stock is not None
        or entree.actif is not None
        or entree.unite is not None
    ):
        raise refus("droits", 403)
    if entree.nom is not None:
        nom = entree.nom.strip()
        if nom != produit.nom:
            prise = db.scalar(
                select(Produit.id).where(
                    Produit.organisation_id == organisation.id,
                    Produit.nom == nom,
                    Produit.id != produit.id,
                )
            )
            if prise is not None:
                raise refus("nom_pris")
        produit.nom = nom
    if entree.unite is not None:
        produit.unite = entree.unite
    if entree.prix_achat is not None:
        produit.prix_achat = entree.prix_achat
    if entree.prix_vente is not None:
        produit.prix_vente = entree.prix_vente
    if entree.stock is not None:
        produit.stock = entree.stock
    if entree.seuil_alerte is not None:
        produit.seuil_alerte = entree.seuil_alerte
    if entree.actif is not None:
        produit.actif = entree.actif
    if entree.note is not None:
        produit.note = entree.note.strip()
    db.commit()
    return present.produit_dict(produit)


@router.post("/produits/{produit_id}/stock")
def reapprovisionner(
    produit_id: int,
    entree: StockEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Le réassort : le stock monte, la fiche garde la trace dans sa note."""
    from ..services import shop

    produit = shop.reapprovisionner(
        db, organisation, produit_id, entree.quantite, entree.note
    )
    return present.produit_dict(produit)
