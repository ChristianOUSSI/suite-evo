from fastapi import APIRouter
from sqlalchemy import select

from ..config import settings
from ..database import SessionLocal
from ..models import Organisation, Vehicule
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
