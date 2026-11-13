from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Bien, User
from ..schemas import (
    BienCorrection,
    BienEntree,
    CompteEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import immo, present

router = APIRouter(tags=["agence"])


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


@router.get("/biens")
def biens(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    type: str | None = None,
    quartier: str | None = None,
) -> dict:
    lignes = immo.liste_biens(
        db, organisation, statut=statut, type_bien=type, quartier=quartier
    )
    return {
        "total": len(lignes),
        "disponibles": sum(1 for un in lignes if un["statut"] == "disponible"),
        "biens": lignes,
    }


@router.get("/biens/{bien_id}")
def fiche(
    bien_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return immo.fiche_bien(db, organisation, bien_id)


@router.post("/biens")
def ajouter_bien(
    entree: BienEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if entree.agent_id is not None:
        agent = db.get(User, entree.agent_id)
        if agent is None or agent.organisation_id != organisation.id:
            raise refus("saisie", agent_id="inconnu")
    bien = Bien(
        organisation_id=organisation.id,
        type=entree.type,
        titre=entree.titre.strip(),
        ville=entree.ville.strip(),
        quartier=entree.quartier.strip(),
        prix=entree.prix,
        surface_m2=entree.surface_m2,
        chambres=entree.chambres,
        description=entree.description.strip(),
        proprietaire_nom=entree.proprietaire_nom.strip(),
        proprietaire_telephone=entree.proprietaire_telephone,
        agent_id=entree.agent_id or compte.id,
        note=entree.note.strip(),
    )
    db.add(bien)
    db.commit()
    db.refresh(bien)
    return present.bien_dict(bien)


@router.patch("/biens/{bien_id}")
def corriger_bien(
    bien_id: int,
    entree: BienCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if entree.agent_id is not None:
        agent = db.get(User, entree.agent_id)
        if agent is None or agent.organisation_id != organisation.id:
            raise refus("saisie", agent_id="inconnu")
    bien = immo.bien_de(db, organisation, bien_id)
    patch = entree.model_dump(exclude_unset=True)
    if "type" in patch and patch["type"] is not None:
        bien.type = patch["type"]
    if "titre" in patch and patch["titre"] is not None:
        bien.titre = patch["titre"].strip()
    if "ville" in patch and patch["ville"] is not None:
        bien.ville = patch["ville"].strip()
    if "quartier" in patch and patch["quartier"] is not None:
        bien.quartier = patch["quartier"].strip()
    if "prix" in patch and patch["prix"] is not None:
        bien.prix = patch["prix"]
    if "surface_m2" in patch and patch["surface_m2"] is not None:
        bien.surface_m2 = patch["surface_m2"]
    if "chambres" in patch and patch["chambres"] is not None:
        bien.chambres = patch["chambres"]
    if "description" in patch and patch["description"] is not None:
        bien.description = patch["description"].strip()
    if "statut" in patch and patch["statut"] is not None:
        bien.statut = patch["statut"]
    if "proprietaire_nom" in patch and patch["proprietaire_nom"] is not None:
        bien.proprietaire_nom = patch["proprietaire_nom"].strip()
    if "proprietaire_telephone" in patch and patch["proprietaire_telephone"] is not None:
        bien.proprietaire_telephone = patch["proprietaire_telephone"]
    if "agent_id" in patch and patch["agent_id"] is not None:
        bien.agent_id = patch["agent_id"]
    if "note" in patch and patch["note"] is not None:
        bien.note = patch["note"].strip()
    db.commit()
    db.refresh(bien)
    return present.bien_dict(bien)
