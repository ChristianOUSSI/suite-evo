from fastapi import APIRouter

from ..config import settings
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Moto, Organisation
from ..messages import refus
from ..schemas import DemandeEntree
from ..services import moto, present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/catalogue")
def catalogue() -> dict:
    """Le catalogue public : les motos en vente, rien d'autre.

    Le visiteur lit la fiche sans compte - ni l'acheteur, ni les
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
            "lien": f"{settings.public_base_url}/catalogue",
        }



@router.post("/demandes", status_code=201)
def demandes(entree: DemandeEntree) -> dict:
    """La demande du client : moto ou réparation, elle arrive « demande »."""
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            raise refus("organisation_inconnue", 404)
        demande = moto.ajouter_demande(db, organisation, entree)
        return {
            "ok": True,
            "id": demande.id,
            "statut": demande.statut,
            "message": "Votre demande est bien arrivée. Le garage vous rappellera au numéro donné.",
        }
