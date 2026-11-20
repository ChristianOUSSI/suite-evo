from fastapi import APIRouter
from sqlalchemy import select

from ..config import settings
from ..database import SessionLocal
from ..models import Organisation, Produit
from ..schemas import CommandePublique
from ..services import present, shop

router = APIRouter(prefix="/public", tags=["public"])


def _organisation(db) -> Organisation | None:
    return db.scalar(select(Organisation).limit(1))


@router.get("/boutique")
def boutique() -> dict:
    """La page publique : la boutique et son stock affiché, rien d'autre.

    Le visiteur lit les articles et leurs prix sans compte - jamais les
    prix d'achat, jamais les ventes.
    """
    with SessionLocal() as db:
        organisation = _organisation(db)
        if organisation is None:
            return {"boutique": None, "produits": [], "lien": ""}
        produits = db.scalars(
            select(Produit)
            .where(
                Produit.organisation_id == organisation.id,
                Produit.actif.is_(True),
                Produit.stock > 0,
            )
            .order_by(Produit.nom)
        ).all()
        return {
            "boutique": present.organisation_dict(organisation),
            "produits": [present.produit_dict(un, public=True) for un in produits],
            "lien": f"{settings.public_base_url}/commander",
        }


@router.post("/commandes", status_code=201)
def commander(entree: CommandePublique) -> dict:
    """La commande du visiteur : un ticket en « commande », pas encore
    validé. La boutique rappelle pour encaisser et retirer."""
    with SessionLocal() as db:
        organisation = _organisation(db)
        if organisation is None:
            from fastapi import HTTPException

            raise HTTPException(
                status_code=503,
                detail={
                    "code": "boutique_absente",
                    "fr": "La boutique n'est pas ouverte.",
                    "en": "The shop is not open.",
                },
            )
        vente = shop.commande_publique(db, organisation, entree)
        return {
            "ok": True,
            "reference": vente.id,
            "total": vente.total,
            "lignes": len(vente.lignes),
            "boutique": present.organisation_dict(organisation),
        }
