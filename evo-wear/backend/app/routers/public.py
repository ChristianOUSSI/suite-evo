from fastapi import APIRouter

from ..config import settings
from sqlalchemy import select

from ..database import SessionLocal
from ..deps import DbSession
from ..models import Article, Organisation
from ..schemas import DemandeEntree
from ..services import present, wear as domaine

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


@router.post("/demandes")
def demande(entree: DemandeEntree, db: DbSession) -> dict:
    """La cliente demande un article sans compte - la boutique confirme."""
    demande = domaine.demande_publique(db, entree)
    return {
        "ok": True,
        "id": demande.id,
        "statut": demande.statut,
        "message": "Votre demande est bien arrivée. La boutique vous rappellera au numéro donné.",
    }
