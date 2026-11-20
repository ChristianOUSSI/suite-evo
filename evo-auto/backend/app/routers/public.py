from fastapi import APIRouter
from sqlalchemy import select

from ..config import settings
from ..database import SessionLocal
from ..deps import DbSession
from ..models import Organisation, Vehicule
from ..messages import refus
from ..schemas import DemandeEntree
from ..services import auto as domaine
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/catalogue")
def catalogue() -> dict:
    """Le catalogue public : les véhicules en vente, rien d'autre.

    Le visiteur lit la fiche sans compte - ni le vendeur, ni les clients,
    ni ce qui est réservé ou vendu.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"concessionnaire": None, "vehicules": []}
        vehicules = db.scalars(
            select(Vehicule)
            .where(
                Vehicule.organisation_id == organisation.id,
                Vehicule.statut == "en_vente",
            )
            .order_by(Vehicule.prix)
        ).all()
        return {
            "concessionnaire": present.organisation_dict(organisation),
            "vehicules": [present.vehicule_publique_dict(un) for un in vehicules],
            "lien": f"{settings.public_base_url}/catalogue",
        }


@router.post("/demandes", status_code=201)
def demande(entree: DemandeEntree, db: DbSession) -> dict:
    """Le visiteur demande un véhicule sans compte - le concessionnaire rappelle."""
    organisation = db.scalar(select(Organisation).limit(1))
    if organisation is None:
        raise refus("organisation_absente", 503)
    demande = domaine.demande_publique(db, organisation, entree)
    return {
        "ok": True,
        "id": demande.id,
        "statut": demande.statut,
        "message": "Votre demande est bien arrivée. Le concessionnaire vous rappellera au numéro donné.",
    }
