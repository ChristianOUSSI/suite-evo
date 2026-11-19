from fastapi import APIRouter

from ..config import settings
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Organisation, Piece
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/catalogue")
def catalogue() -> dict:
    """Le catalogue public : les pièces en vitrine, rien d'autre.

    Le visiteur lit la fiche sans compte - ni l'acheteur, ni les
    clients, ni le prix d'achat, ni ce qui est réservé ou vendu.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"bijouterie": None, "pieces": []}
        pieces = db.scalars(
            select(Piece)
            .where(
                Piece.organisation_id == organisation.id,
                Piece.statut == "en_vitrine",
            )
            .order_by(Piece.prix_vente)
        ).all()
        return {
            "bijouterie": present.organisation_dict(organisation),
            "pieces": [present.piece_dict(un, public=True) for un in pieces],
            "lien": f"{settings.public_base_url}/catalogue",
        }
