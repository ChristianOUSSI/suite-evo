from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Organisation, Tache, User
from ..schemas import (
    CompteEntree,
    CompletionEntree,
    OrganisationEntree,
    TacheCorrection,
    TacheEntree,
)
from ..security import hash_password
from ..services import agent as domaine
from ..services import present
from ..utils import aujourdhui, periode_de

router = APIRouter(tags=["agent"])


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


@router.get("/taches")
def taches(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    type: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_taches(
        db,
        organisation,
        statut=statut,
        type_=type,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_attente": sum(1 for un in lignes if un["statut"] == "en_attente"),
        "en_cours": sum(1 for un in lignes if un["statut"] == "en_cours"),
        "terminees": sum(1 for un in lignes if un["statut"] == "terminee"),
        "taches": lignes,
    }


@router.post("/taches")
def ajouter_tache(
    entree: TacheEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    tache = domaine.enregistrer_tache(db, organisation, entree, compte)
    return present.tache_dict(tache)


@router.patch("/taches/{tache_id}")
def corriger_tache(
    tache_id: int,
    entree: TacheCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    tache = domaine.corriger_tache(db, organisation, tache_id, patch)
    return present.tache_dict(tache)


@router.post("/taches/{tache_id}/executer")
def executer(
    tache_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    execution = domaine.executer_tache(db, organisation, tache_id)
    return present.execution_dict(execution)


@router.post("/taches/{tache_id}/terminer")
def terminer(
    tache_id: int,
    entree: CompletionEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    tache = domaine.terminer_tache(db, organisation, tache_id, entree)
    return present.tache_dict(tache)


@router.get("/executions")
def executions(
    organisation: OrganisationCourante,
    db: DbSession,
    tache_id: int | None = None,
) -> dict:
    lignes = domaine.liste_executions(db, organisation, tache_id=tache_id)
    return {"total": len(lignes), "executions": lignes}
