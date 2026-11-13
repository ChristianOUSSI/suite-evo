from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import User
from ..schemas import ColisEntree, ColisCorrection, CompteEntree, OrganisationEntree
from ..security import hash_password
from ..services import log, present

router = APIRouter(tags=["transporteur"])


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


@router.get("/colis")
def colis(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    genre: str | None = None,
    trajet: str | None = None,
    periode: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = log.liste_colis(
        db,
        organisation,
        statut=statut,
        genre=genre,
        trajet=trajet,
        periode=periode,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_transit": sum(1 for un in lignes if un["statut"] == "en_transit"),
        "colis": lignes,
    }


@router.get("/colis/{colis_id}")
def fiche(
    colis_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return log.fiche_colis(db, organisation, colis_id)


@router.post("/colis")
def deposer(
    entree: ColisEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Un dépôt : le numéro de suivi se génère tout seul."""
    return present.colis_dict(log.deposer(db, organisation, entree, compte))


@router.patch("/colis/{colis_id}")
def corriger(
    colis_id: int,
    entree: ColisCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    return present.colis_dict(log.corriger(db, organisation, colis_id, patch))
