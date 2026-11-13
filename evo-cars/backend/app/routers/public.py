from fastapi import APIRouter
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Organisation, Piece, Voiture
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/catalogue")
def catalogue() -> dict:
    """Le catalogue public : voitures et pièces en vente, rien d'autre.

    Le visiteur lit la fiche sans compte — ni l'acheteur, ni les
    clients, ni ce qui est réservé, vendu ou en rupture.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"garage": None, "voitures": [], "pieces": []}
        voitures = db.scalars(
            select(Voiture)
            .where(
                Voiture.organisation_id == organisation.id,
                Voiture.statut == "en_vente",
            )
            .order_by(Voiture.prix)
        ).all()
        pieces = db.scalars(
            select(Piece)
            .where(
                Piece.organisation_id == organisation.id,
                Piece.statut == "en_stock",
                Piece.stock > 0,
            )
            .order_by(Piece.designation)
        ).all()
        return {
            "garage": present.organisation_dict(organisation),
            "voitures": [present.voiture_dict(un, public=True) for un in voitures],
            "pieces": [present.piece_dict(un, public=True) for un in pieces],
        }
