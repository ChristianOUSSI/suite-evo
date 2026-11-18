from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Organisation, User
from ..schemas import (
    CommandeCorrection,
    CommandeEntree,
    CompteEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import present
from ..services import voice as domaine
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["voix"])


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
        raise refus("adresse_prise", 409)
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


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    return domaine.etat(db, organisation)


@router.get("/recap")
def recap(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    return domaine.recap(db, organisation, periode or periode_de(aujourdhui()))


@router.get("/commandes")
def commandes(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    intention: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_commandes(
        db,
        organisation,
        statut=statut,
        intention=intention,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "recues": sum(1 for un in lignes if un["statut"] == "recue"),
        "interpretees": sum(1 for un in lignes if un["statut"] == "interpretee"),
        "executees": sum(1 for un in lignes if un["statut"] == "executee"),
        "commandes": lignes,
    }


@router.post("/commandes")
def ajouter_commande(
    entree: CommandeEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    commande = domaine.enregistrer_commande(db, organisation, entree, compte)
    return present.commande_dict(commande)


@router.patch("/commandes/{commande_id}")
def corriger_commande(
    commande_id: int,
    entree: CommandeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    commande = domaine.corriger_commande(db, organisation, commande_id, patch)
    return present.commande_dict(commande)


@router.post("/commandes/{commande_id}/executer")
def executer(
    commande_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    commande = domaine.executer_commande(db, organisation, commande_id)
    return present.commande_dict(commande)
