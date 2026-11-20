from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import DbSession, OrganisationCourante, CompteCourant
from ..messages import refus
from ..models import Organisation, Piece, User, Voiture
from ..schemas import (
    ClientEntree,
    CompteEntree,
    OrganisationEntree,
    PieceCorrection,
    PieceEntree,
    VoitureCorrection,
    VoitureEntree,
    DemandeCorrection,
)
from ..security import hash_password
from ..services import cars as domaine
from ..services import present

router = APIRouter(tags=["garage"])


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


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    return domaine.etat(db, organisation)


@router.get("/recap")
def recap(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    from ..utils import aujourdhui
    from ..utils import periode_de
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
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    client = domaine.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/voitures")
def voitures(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    marque: str | None = None,
    carburant: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_voitures(
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
        "vendues": sum(1 for un in lignes if un["statut"] == "vendu"),
        "voitures": lignes,
    }


@router.post("/voitures")
def ajouter_voiture(
    entree: VoitureEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    voiture = domaine.enregistrer_voiture(db, organisation, entree)
    return present.voiture_dict(voiture)


@router.patch("/voitures/{voiture_id}")
def corriger_voiture(
    voiture_id: int,
    entree: VoitureCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    voiture = domaine.corriger_voiture(db, organisation, voiture_id, patch)
    return present.voiture_dict(voiture)


@router.get("/pieces")
def pieces(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_pieces(
        db,
        organisation,
        statut=statut,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_stock": sum(1 for un in lignes if un["statut"] == "en_stock"),
        "epuisees": sum(1 for un in lignes if un["statut"] == "epuise"),
        "pieces": lignes,
    }


@router.post("/pieces")
def ajouter_piece(
    entree: PieceEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    piece = domaine.enregistrer_piece(db, organisation, entree)
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
    piece = domaine.corriger_piece(db, organisation, piece_id, patch)
    return present.piece_dict(piece)


@router.get("/demandes")
def demandes(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = Query(default=None),
) -> dict:
    lignes = domaine.liste_demandes(db, organisation, statut=statut)
    return {
        "total": len(lignes),
        "en_attente": sum(1 for un in lignes if un.statut == "demande"),
        "demandes": [domaine.demande_dict(un) for un in lignes],
    }


@router.patch("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    demande = domaine.corriger_demande(db, organisation, demande_id, entree.statut or "")
    return domaine.demande_dict(demande)
