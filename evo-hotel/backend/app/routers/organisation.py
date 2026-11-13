from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Chambre, Client, User
from ..schemas import (
    ChambreCorrection,
    ChambreEntree,
    ClientCorrection,
    ClientEntree,
    CompteEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import hotel, present

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


@router.get("/chambres")
def chambres(organisation: OrganisationCourante, db: DbSession) -> dict:
    lignes = db.scalars(
        select(Chambre)
        .where(Chambre.organisation_id == organisation.id)
        .order_by(Chambre.numero)
    ).all()
    return {
        "total": len(lignes),
        "actives": sum(1 for un in lignes if un.actif),
        "chambres": [present.chambre_dict(un) for un in lignes],
    }


@router.post("/chambres")
def ajouter_chambre(
    entree: ChambreEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    numero = entree.numero.strip()
    prise = db.scalar(
        select(Chambre.id).where(
            Chambre.organisation_id == organisation.id,
            Chambre.numero == numero,
        )
    )
    if prise is not None:
        raise refus("numero_pris")
    chambre = Chambre(
        organisation_id=organisation.id,
        numero=numero,
        type=entree.type,
        prix_par_nuit=entree.prix_par_nuit,
        capacite=entree.capacite,
        note=entree.note.strip(),
    )
    db.add(chambre)
    db.commit()
    return present.chambre_dict(chambre)


@router.patch("/chambres/{chambre_id}")
def corriger_chambre(
    chambre_id: int,
    entree: ChambreCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    chambre = hotel.chambre_de(db, organisation, chambre_id)
    if entree.numero is not None and entree.numero.strip() != chambre.numero:
        numero = entree.numero.strip()
        prise = db.scalar(
            select(Chambre.id).where(
                Chambre.organisation_id == organisation.id,
                Chambre.numero == numero,
                Chambre.id != chambre.id,
            )
        )
        if prise is not None:
            raise refus("numero_pris")
        chambre.numero = numero
    if entree.type is not None:
        chambre.type = entree.type
    if entree.prix_par_nuit is not None:
        chambre.prix_par_nuit = entree.prix_par_nuit
    if entree.capacite is not None:
        chambre.capacite = entree.capacite
    if entree.actif is not None:
        chambre.actif = entree.actif
    if entree.note is not None:
        chambre.note = entree.note.strip()
    db.commit()
    return present.chambre_dict(chambre)


@router.get("/clients")
def clients(organisation: OrganisationCourante, db: DbSession) -> dict:
    lignes = db.scalars(
        select(Client)
        .where(Client.organisation_id == organisation.id)
        .order_by(Client.nom)
    ).all()
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un.actif),
        "clients": [present.client_dict(un) for un in lignes],
    }


@router.post("/clients")
def ajouter_client(
    entree: ClientEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if entree.telephone:
        prise = db.scalar(
            select(Client.id).where(
                Client.organisation_id == organisation.id,
                Client.telephone == entree.telephone,
            )
        )
        if prise is not None:
            raise refus("meme_telephone")
    client = Client(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        telephone=entree.telephone,
        piece=entree.piece.strip(),
        note=entree.note.strip(),
    )
    db.add(client)
    db.commit()
    return present.client_dict(client)


@router.patch("/clients/{client_id}")
def corriger_client(
    client_id: int,
    entree: ClientCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    client = hotel.client_de(db, organisation, client_id)
    if entree.telephone is not None and entree.telephone != client.telephone:
        if entree.telephone:
            prise = db.scalar(
                select(Client.id).where(
                    Client.organisation_id == organisation.id,
                    Client.telephone == entree.telephone,
                    Client.id != client.id,
                )
            )
            if prise is not None:
                raise refus("meme_telephone")
        client.telephone = entree.telephone
    if entree.nom is not None:
        client.nom = entree.nom.strip()
    if entree.piece is not None:
        client.piece = entree.piece.strip()
    if entree.actif is not None:
        client.actif = entree.actif
    if entree.note is not None:
        client.note = entree.note.strip()
    db.commit()
    return present.client_dict(client)
