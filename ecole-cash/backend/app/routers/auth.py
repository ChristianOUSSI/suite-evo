from fastapi import APIRouter, HTTPException, Response

from ..config import settings
from ..deps import CurrentUser, DbSession
from ..models import User
from ..schemas import LoginIn
from ..security import creer_jeton, verify_password
from ..services import present

router = APIRouter(tags=["séance"])


@router.post("/auth/login")
def connexion(entree: LoginIn, response: Response, db: DbSession) -> dict:
    """La séance s'installe dans un cookie httpOnly, dix heures durant."""
    membre = db.query(User).filter(User.email == entree.email.lower()).first()
    if not membre or not verify_password(entree.password, membre.mot_de_passe):
        raise HTTPException(
            status_code=401, detail="Cet email ou ce mot de passe ne passe pas."
        )
    response.set_cookie(
        key=settings.cookie_name,
        value=creer_jeton(membre.id, membre.ecole_id),
        max_age=settings.jwt_ttl_hours * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )
    return {
        "user": present.user_dict(membre),
        "ecole": present.ecole_dict(membre.ecole),
        "expires_in_hours": settings.jwt_ttl_hours,
    }


@router.post("/auth/logout", status_code=204)
def deconnexion(response: Response, membre: CurrentUser) -> None:
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/auth/me")
def moi(membre: CurrentUser) -> dict:
    return {
        "user": present.user_dict(membre),
        "ecole": present.ecole_dict(membre.ecole),
        "annee": present.annee_courante(membre.ecole),
    }
