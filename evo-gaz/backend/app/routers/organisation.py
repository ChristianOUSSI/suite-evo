from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Client, Organisation, User
from ..schemas import (
    ClientCorrection,
    ClientEntree,
    CompteEntree,
    LivraisonCorrection,
    LivraisonEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import gaz as domaine
from ..services import present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["depot"])


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


@router.get("/clients")
def clients(
    organisation: OrganisationCourante,
    db: DbSession,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_clients(db, organisation, recherche=recherche)
    return {"total": len(lignes), "clients": lignes}


@router.post("/clients")
def ajouter_client(
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    client = domaine.enregistrer_client(db, organisation, entree)
    return present.client_dict(client)


@router.patch("/clients/{client_id}")
def corriger_client(
    client_id: int,
    entree: ClientCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    client = domaine.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/livraisons")
def livraisons(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    client_id: int | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_livraisons(
        db,
        organisation,
        statut=statut,
        client_id=client_id,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_cours": sum(1 for un in lignes if un["statut"] in ("commandee", "en_route")),
        "livrees": sum(1 for un in lignes if un["statut"] == "livree"),
        "livraisons": lignes,
    }


@router.post("/livraisons")
def ajouter_livraison(
    entree: LivraisonEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    livraison = domaine.enregistrer_livraison(db, organisation, entree)
    return present.livraison_dict(livraison)


@router.patch("/livraisons/{livraison_id}")
def corriger_livraison(
    livraison_id: int,
    entree: LivraisonCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    livraison = domaine.corriger_livraison(db, organisation, livraison_id, patch)
    return present.livraison_dict(livraison)
