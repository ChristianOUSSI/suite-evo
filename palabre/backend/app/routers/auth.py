from fastapi import APIRouter, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import joinedload

from ..config import settings
from ..deps import CurrentUser, DbSession
from ..models import User
from ..schemas import LoginIn, SessionOut
from ..security import create_access_token, verify_password
from ..services.present import session_dict

router = APIRouter(prefix="/auth", tags=["session"])


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=token,
        max_age=settings.jwt_ttl_hours * 3600,
        httponly=True,
        samesite="lax",
        secure=settings.cookie_secure,
        path="/",
    )


@router.post("/login", response_model=SessionOut)
def login(payload: LoginIn, response: Response, db: DbSession) -> dict:
    user = db.scalar(
        select(User)
        .options(joinedload(User.merchant))
        .where(func.lower(User.email) == payload.email.lower())
    )
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )

    _set_session_cookie(
        response, create_access_token(user.id, user.merchant_id)
    )
    return session_dict(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> None:
    response.delete_cookie(settings.cookie_name, path="/")


@router.get("/me", response_model=SessionOut)
def me(user: CurrentUser) -> dict:
    return session_dict(user)
