from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .messages import refus
from .models import Entreprise, User
from .security import lire_jeton


def courant(request: Request, db: Annotated[Session, Depends(get_db)]) -> User:
    """La séance se lit dans le cookie, et le refus part dans les deux langues."""
    token = request.cookies.get(settings.cookie_name)
    if not token:
        entete = request.headers.get("authorization", "")
        if entete.lower().startswith("bearer "):
            token = entete[7:].strip()

    payload = lire_jeton(token) if token else None
    if not payload:
        raise refus("seance_expiree", 401)

    try:
        identifiant = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise refus("seance_invalide", 401) from None

    compte = db.scalar(
        select(User)
        .options(joinedload(User.entreprise))
        .where(User.id == identifiant)
    )
    if not compte or payload.get("entreprise") != compte.entreprise_id:
        raise refus("seance_invalide", 401)
    return compte


CompteCourant = Annotated[User, Depends(courant)]
DbSession = Annotated[Session, Depends(get_db)]


def entreprise_courante(compte: CompteCourant) -> Entreprise:
    return compte.entreprise


EntrepriseCourante = Annotated[Entreprise, Depends(entreprise_courante)]
