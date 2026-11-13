from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Note, Organisation, User
from ..schemas import (
    CompteEntree,
    NoteCorrection,
    NoteEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import carnet as domaine
from ..services import present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["carnet"])


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


@router.get("/notes")
def notes(
    organisation: OrganisationCourante,
    db: DbSession,
    categorie: str | None = None,
    recherche: str | None = None,
    archivees: bool = False,
) -> dict:
    lignes = domaine.liste_notes(
        db,
        organisation,
        categorie=categorie,
        recherche=recherche,
        archivees=archivees,
    )
    return {"total": len(lignes), "notes": lignes}


@router.post("/notes")
def ajouter_note(
    entree: NoteEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    note = domaine.enregistrer_note(db, organisation, entree)
    return present.note_dict(note)


@router.patch("/notes/{note_id}")
def corriger_note(
    note_id: int,
    entree: NoteCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    note = domaine.corriger_note(db, organisation, note_id, patch)
    return present.note_dict(note)
