from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import User
from ..schemas import AppelCorrection, AppelEntree, CompteEntree, OrganisationEntree
from ..security import hash_password
from ..services import calls, present

router = APIRouter(tags=["standard"])


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


@router.get("/appels")
def appels(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    agent_id: int | None = None,
    sens: str | None = None,
    periode: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = calls.liste_appels(
        db,
        organisation,
        statut=statut,
        agent_id=agent_id,
        sens=sens,
        periode=periode,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_file": sum(1 for un in lignes if un["statut"] == "en_file"),
        "en_cours": sum(1 for un in lignes if un["statut"] == "en_cours"),
        "appels": lignes,
    }


@router.get("/appels/{appel_id}")
def fiche(
    appel_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return calls.fiche_appel(db, organisation, appel_id)


@router.post("/appels")
def ajouter_appel(
    entree: AppelEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    appel = calls.enregistrer_appel(db, organisation, entree, compte)
    return present.appel_dict(appel)


@router.patch("/appels/{appel_id}")
def corriger_appel(
    appel_id: int,
    entree: AppelCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    appel = calls.corriger_appel(db, organisation, appel_id, patch, compte)
    return present.appel_dict(appel)
