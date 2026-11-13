from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .models import User
from .security import decode_access_token


def get_current_user(
    request: Request, db: Annotated[Session, Depends(get_db)]
) -> User:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        authorization = request.headers.get("authorization", "")
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()

    payload = decode_access_token(token) if token else None
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre session a expiré. Reconnectez-vous.",
        )

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Session invalide.") from None

    user = db.scalar(
        select(User).options(joinedload(User.organization)).where(User.id == user_id)
    )
    if not user or payload.get("org") != user.organization_id:
        raise HTTPException(status_code=401, detail="Session invalide.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[Session, Depends(get_db)]
