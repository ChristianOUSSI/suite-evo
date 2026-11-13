from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from .config import settings
from .database import get_db
from .models import Boutique, Main
from .security import lire_jeton


def courant(
    request: Request, db: Annotated[Session, Depends(get_db)]
) -> Main:
    token = request.cookies.get(settings.cookie_name)
    if not token:
        entete = request.headers.get("authorization", "")
        if entete.lower().startswith("bearer "):
            token = entete[7:].strip()

    payload = lire_jeton(token) if token else None
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Votre séance a expiré. Reprenez le comptoir.",
        )

    try:
        identifiant = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Séance invalide.") from None

    main = db.scalar(
        select(Main).options(joinedload(Main.boutique)).where(Main.id == identifiant)
    )
    if not main or payload.get("boutique") != main.boutique_id:
        raise HTTPException(status_code=401, detail="Séance invalide.")
    return main


MainCourante = Annotated[Main, Depends(courant)]
DbSession = Annotated[Session, Depends(get_db)]


def boutique_courante(main: MainCourante) -> Boutique:
    return main.boutique


CurrentBoutique = Annotated[Boutique, Depends(boutique_courante)]
