from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Client, User, Vehicule
from ..schemas import (
    ClientEntree,
    DemandeCorrection,
    CompteEntree,
    OrganisationEntree,
    VehiculeCorrection,
    VehiculeEntree,
)
from ..security import hash_password
from ..services import auto, present

router = APIRouter(tags=["parc"])


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
    lignes = auto.liste_clients(db, organisation, recherche=recherche)
    return {"total": len(lignes), "clients": lignes}


@router.post("/clients")
def ajouter_client(
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    client = auto.enregistrer_client(db, organisation, entree)
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
    client = auto.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/vehicules")
def vehicules(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    marque: str | None = None,
    carburant: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = auto.liste_vehicules(
        db,
        organisation,
        statut=statut,
        marque=marque,
        carburant=carburant,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_vente": sum(1 for un in lignes if un["statut"] == "en_vente"),
        "vendus": sum(1 for un in lignes if un["statut"] == "vendu"),
        "vehicules": lignes,
    }


@router.post("/vehicules")
def ajouter_vehicule(
    entree: VehiculeEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    vehicule = auto.enregistrer_vehicule(db, organisation, entree)
    return present.vehicule_dict(vehicule)


@router.patch("/vehicules/{vehicule_id}")
def corriger_vehicule(
    vehicule_id: int,
    entree: VehiculeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    vehicule = auto.corriger_vehicule(db, organisation, vehicule_id, patch)
    return present.vehicule_dict(vehicule)


@router.get("/demandes")
def demandes(db: DbSession, organisation: OrganisationCourante, statut: str | None = None) -> dict:
    rows, en_attente, total = auto.liste_demandes(db, organisation, statut)
    return {
        "en_attente": en_attente,
        "total": total,
        "demandes": [present.demande_dict(un) for un in rows],
    }


@router.post("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    db: DbSession,
    organisation: OrganisationCourante,
) -> dict:
    demande = auto.demande_de(db, organisation, demande_id)
    demande = auto.corriger_demande(db, demande, entree.statut or "demande")
    return present.demande_dict(demande)
