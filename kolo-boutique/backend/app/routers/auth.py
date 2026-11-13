from fastapi import APIRouter, HTTPException, Response
from sqlalchemy import select

from ..config import settings
from ..deps import DbSession, MainCourante
from ..models import Main
from ..schemas import SeanceEntree
from ..security import creer_jeton, verify_password
from ..services import present

router = APIRouter(tags=["séance"])


@router.post("/auth/login")
def connexion(entree: SeanceEntree, response: Response, db: DbSession) -> dict:
    """La séance s'installe dans un cookie httpOnly, douze heures durant."""
    email = entree.email.strip().lower()
    main = db.scalar(select(Main).where(Main.email == email))
    if not main or not verify_password(entree.mot_de_passe, main.mot_de_passe):
        raise HTTPException(
            status_code=401, detail="Cette adresse ou ce mot de passe ne passe pas."
        )

    response.set_cookie(
        key=settings.cookie_name,
        value=creer_jeton(main.id, main.boutique_id),
        max_age=settings.jwt_ttl_hours * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )
    return {
        "user": present.main_dict(main),
        "boutique": present.boutique_dict(main.boutique),
        "expires_in_hours": settings.jwt_ttl_hours,
    }


@router.post("/auth/logout", status_code=204)
def deconnexion(response: Response, main: MainCourante) -> None:
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/auth/me")
def moi(main: MainCourante) -> dict:
    return {
        "user": present.main_dict(main),
        "boutique": present.boutique_dict(main.boutique),
        "demo": settings.demo_mode,
    }
