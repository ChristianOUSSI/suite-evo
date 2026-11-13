from fastapi import APIRouter
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Moto, Organisation
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/catalogue")
def catalogue() -> dict:
    """Le catalogue public : les motos en vente, rien d'autre.

    Le visiteur lit la fiche sans compte — ni l'acheteur, ni les
    clients, ni ce qui est réservé ou vendu.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"garage": None, "motos": []}
        motos = db.scalars(
            select(Moto)
            .where(
                Moto.organisation_id == organisation.id,
                Moto.statut == "en_vente",
            )
            .order_by(Moto.prix)
        ).all()
        return {
            "garage": present.organisation_dict(organisation),
            "motos": [present.moto_dict(un, public=True) for un in motos],
        }
