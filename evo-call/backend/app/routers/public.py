from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from ..database import SessionLocal
from ..models import Appel, Organisation
from ..schemas import RappelEntree
from ..services import calls, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/file")
def file_attente() -> dict:
    """La file publique : combien de personnes attendent, rien d'autre.

    L'appelant qui compose le numéro du centre lit la file sans compte -
    jamais les noms, jamais les numéros.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"centre": None, "en_file": 0, "en_cours": 0}
        en_file = db.scalar(
            select(func.count(Appel.id)).where(
                Appel.organisation_id == organisation.id,
                Appel.statut == "en_file",
            )
        ) or 0
        en_cours = db.scalar(
            select(func.count(Appel.id)).where(
                Appel.organisation_id == organisation.id,
                Appel.statut == "en_cours",
            )
        ) or 0
        return {
            "centre": present.organisation_dict(organisation),
            "en_file": en_file,
            "en_cours": en_cours,
        }


@router.get("/centre")
def centre() -> dict:
    """La carte du centre : nom, ville, numéro - pour la page de rappel."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"centre": None}
        return {"centre": present.organisation_dict(organisation)}


@router.post("/rappel", status_code=201)
def rappel(entree: RappelEntree) -> dict:
    """Le client demande à être rappelé, sans compte.

    Sa demande entre dans la file des rappels : le standard la voit comme
    un rappel programmé, avec son nom, son numéro et son motif.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            raise HTTPException(
                status_code=503,
                detail={
                    "code": "centre_absent",
                    "fr": "Ce centre n'est pas ouvert.",
                    "en": "This centre is not open.",
                },
            )
        appel = calls.rappel_public(db, organisation, entree)
        return {
            "ok": True,
            "reference": appel.id,
            "centre": present.organisation_dict(organisation),
        }
