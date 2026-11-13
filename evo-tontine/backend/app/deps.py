from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .models import Groupe, User
from .security import lire_jeton


def courant(request: Request, db: Annotated[Session, Depends(get_db)]) -> User:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        entete = request.headers.get("authorization", "")
        if entete.lower().startswith("bearer "):
            token = entete[7:].strip()

    payload = lire_jeton(token) if token else None
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre séance a expiré. Revenez au cercle.",
        )

    try:
        identifiant = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Séance invalide.") from None

    compte = db.scalar(
        select(User).options(joinedload(User.groupe)).where(User.id == identifiant)
    )
    if not compte or payload.get("groupe") != compte.groupe_id:
        raise HTTPException(status_code=401, detail="Séance invalide.")
    return compte


CompteCourant = Annotated[User, Depends(courant)]
DbSession = Annotated[Session, Depends(get_db)]


def groupe_courant(compte: CompteCourant) -> Groupe:
    return compte.groupe


GroupeCourant = Annotated[Groupe, Depends(groupe_courant)]
