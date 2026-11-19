from fastapi import APIRouter

from ..config import settings
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Article, Organisation
from ..services import present

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/catalogue")
def catalogue() -> dict:
    """Le catalogue public : les articles en stock, rien d'autre.

    La cliente lit la fiche sans compte - ni la cliente acheteuse, ni
    les prix d'achat, ni ce qui est vendu ou épuisé.
    """
    with SessionLocal() as db:
        organisation = db.scalar(select(Organisation).limit(1))
        if organisation is None:
            return {"boutique": None, "articles": []}
        articles = db.scalars(
            select(Article)
            .where(
                Article.organisation_id == organisation.id,
                Article.statut == "en_stock",
                Article.stock > 0,
            )
            .order_by(Article.categorie, Article.nom)
        ).all()
        return {
            "boutique": present.organisation_dict(organisation),
            "articles": [present.article_dict(un, public=True) for un in articles],
            "lien": f"{settings.public_base_url}/catalogue",
        }
