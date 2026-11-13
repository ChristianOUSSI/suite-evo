import json

from fastapi import APIRouter, Response
from sqlalchemy import select

from ..config import settings
from ..deps import CompteCourant, DbSession
from ..messages import refus
from ..models import User
from ..schemas import SeanceEntree
from ..security import creer_jeton, verify_password
from ..services import present

router = APIRouter(prefix="/auth", tags=["seance"])


@router.post("/login")
def login(entree: SeanceEntree, db: DbSession) -> Response:
    compte = db.scalar(select(User).where(User.email == entree.email.strip().lower()))
    if compte is None or not verify_password(entree.mot_de_passe, compte.mot_de_passe):
        raise refus("identifiants", 401)

    jeton = creer_jeton(compte.id, compte.organisation_id)
    reponse = Response()
    reponse.set_cookie(
        settings.cookie_name,
        jeton,
        max_age=settings.jwt_ttl_hours * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )
    reponse.body = json.dumps(
        {
            "user": present.compte_dict(compte),
            "organisation": present.organisation_dict(compte.organisation),
            "expires_in_hours": settings.jwt_ttl_hours,
        }
    ).encode()
    reponse.media_type = "application/json"
    return reponse


@router.post("/logout")
def logout() -> dict:
    return {"deconnecte": True}


@router.get("/me")
def moi(compte: CompteCourant) -> dict:
    return {
        "user": present.compte_dict(compte),
        "organisation": present.organisation_dict(compte.organisation),
        "demo": settings.demo_mode,
    }
