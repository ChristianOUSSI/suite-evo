from fastapi import APIRouter, Response
from sqlalchemy import select

from ..config import settings
from ..deps import CompteCourant, DbSession
from ..messages import refus
from ..models import User
from ..schemas import SeanceEntree
from ..security import creer_jeton, verify_password
from ..services import present

router = APIRouter(tags=["séance"])


@router.post("/auth/login")
def connexion(entree: SeanceEntree, response: Response, db: DbSession) -> dict:
    """La séance tient dans un cookie httpOnly, douze heures."""
    compte = db.scalar(
        select(User).where(User.email == entree.email.strip().lower())
    )
    if compte is None or not verify_password(entree.mot_de_passe, compte.mot_de_passe):
        raise refus("identifiants", 401)

    response.set_cookie(
        key=settings.cookie_name,
        value=creer_jeton(compte.id, compte.groupe_id),
        max_age=settings.jwt_ttl_hours * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )
    return {
        "user": present.compte_dict(compte),
        "groupe": present.groupe_dict(compte.groupe),
        "expires_in_hours": settings.jwt_ttl_hours,
    }


@router.post("/auth/logout", status_code=204)
def deconnexion(response: Response, compte: CompteCourant) -> None:
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/auth/me")
def moi(compte: CompteCourant) -> dict:
    return {
        "user": present.compte_dict(compte),
        "groupe": present.groupe_dict(compte.groupe),
        "demo": settings.demo_mode,
    }
