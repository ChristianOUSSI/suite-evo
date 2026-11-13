from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Client, User
from ..schemas import (
    ClientEntree,
    CompteEntree,
    EnvoiEntree,
    OrganisationEntree,
    SuiviEntree,
)
from ..security import hash_password
from ..services import fret, present

router = APIRouter(tags=["quai"])


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


@router.get("/clients")
def clients(
    organisation: OrganisationCourante,
    db: DbSession,
    recherche: str | None = None,
) -> dict:
    lignes = fret.liste_clients(db, organisation, recherche=recherche)
    return {"total": len(lignes), "clients": lignes}


@router.post("/clients")
def ajouter_client(
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    client = fret.enregistrer_client(db, organisation, entree)
    return present.client_dict(client)


@router.patch("/clients/{client_id}")
def corriger_client(
    client_id: int,
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    client = fret.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/envois")
def envois(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    mode: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = fret.liste_envois(
        db,
        organisation,
        statut=statut,
        mode=mode,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_attente": sum(1 for un in lignes if un["statut"] == "en_attente"),
        "en_transit": sum(1 for un in lignes if un["statut"] == "en_transit"),
        "envois": lignes,
    }


@router.get("/envois/{envoi_id}")
def fiche(
    envoi_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return fret.fiche_envoi(db, organisation, envoi_id)


@router.post("/envois")
def ajouter_envoi(
    entree: EnvoiEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    envoi = fret.enregistrer_envoi(db, organisation, entree)
    return present.envoi_dict(envoi)


@router.post("/envois/{envoi_id}/suivi")
def avancer(
    envoi_id: int,
    entree: SuiviEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    envoi = fret.avancer_envoi(db, organisation, envoi_id, entree)
    return present.envoi_dict(envoi)
