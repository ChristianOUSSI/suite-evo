from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Client, User, Moto, Reparation
from ..schemas import (
    ClientEntree,
    CompteEntree,
    MotoCorrection,
    MotoEntree,
    OrganisationEntree,
    ReparationCorrection,
    ReparationEntree,
)
from ..security import hash_password
from ..services import moto as domaine
from ..services import present

router = APIRouter(tags=["atelier"])


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
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    client = domaine.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/motos")
def motos(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    marque: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_motos(
        db,
        organisation,
        statut=statut,
        marque=marque,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_vente": sum(1 for un in lignes if un["statut"] == "en_vente"),
        "vendues": sum(1 for un in lignes if un["statut"] == "vendu"),
        "motos": lignes,
    }


@router.post("/motos")
def ajouter_moto(
    entree: MotoEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    moto = domaine.enregistrer_moto(db, organisation, entree)
    return present.moto_dict(moto)


@router.patch("/motos/{moto_id}")
def corriger_moto(
    moto_id: int,
    entree: MotoCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    moto = domaine.corriger_moto(db, organisation, moto_id, patch)
    return present.moto_dict(moto)


@router.get("/reparations")
def reparations(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    client_id: int | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_reparations(
        db,
        organisation,
        statut=statut,
        client_id=client_id,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_cours": sum(1 for un in lignes if un["statut"] in ("recue", "en_cours")),
        "livrees": sum(1 for un in lignes if un["statut"] == "livree"),
        "reparations": lignes,
    }


@router.post("/reparations")
def ajouter_reparation(
    entree: ReparationEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    un = domaine.enregistrer_reparation(db, organisation, entree)
    return present.reparation_dict(un)


@router.patch("/reparations/{reparation_id}")
def corriger_reparation(
    reparation_id: int,
    entree: ReparationCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    un = domaine.corriger_reparation(db, organisation, reparation_id, patch)
    return present.reparation_dict(un)
