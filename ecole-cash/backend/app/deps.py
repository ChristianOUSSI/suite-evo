from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .models import Ecole, User
from .security import lire_jeton


def courant(
    request: Request, db: Annotated[Session, Depends(get_db)]
) -> User:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        entete = request.headers.get("authorization", "")
        if entete.lower().startswith("bearer "):
            token = entete[7:].strip()

    payload = lire_jeton(token) if token else None
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre séance a expiré. Reprenez la caisse.",
        )

    try:
        identifiant = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Séance invalide.") from None

    membre = db.scalar(
        select(User).options(joinedload(User.ecole)).where(User.id == identifiant)
    )
    if not membre or payload.get("ecole") != membre.ecole_id:
        raise HTTPException(status_code=401, detail="Séance invalide.")
    return membre


CurrentUser = Annotated[User, Depends(courant)]
DbSession = Annotated[Session, Depends(get_db)]


def ecole_courante(membre: CurrentUser) -> Ecole:
    return membre.ecole


CurrentEcole = Annotated[Ecole, Depends(ecole_courante)]
