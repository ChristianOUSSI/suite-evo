from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Client, User, Piece
from ..schemas import (
    ClientEntree,
    CompteEntree,
    OrganisationEntree,
    PieceCorrection,
    PieceEntree,
)
from ..security import hash_password
from ..services import bijou, present

router = APIRouter(tags=["vitrine"])


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
    lignes = bijou.liste_clients(db, organisation, recherche=recherche)
    return {"total": len(lignes), "clients": lignes}


@router.post("/clients")
def ajouter_client(
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    client = bijou.enregistrer_client(db, organisation, entree)
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
    client = bijou.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/pieces")
def pieces(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    matiere: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = bijou.liste_pieces(
        db,
        organisation,
        statut=statut,
        matiere=matiere,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_vitrine": sum(1 for un in lignes if un["statut"] == "en_vitrine"),
        "vendues": sum(1 for un in lignes if un["statut"] == "vendu"),
        "pieces": lignes,
    }


@router.post("/pieces")
def ajouter_piece(
    entree: PieceEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    piece = bijou.enregistrer_piece(db, organisation, entree)
    return present.piece_dict(piece)


@router.patch("/pieces/{piece_id}")
def corriger_piece(
    piece_id: int,
    entree: PieceCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    piece = bijou.corriger_piece(db, organisation, piece_id, patch)
    return present.piece_dict(piece)
