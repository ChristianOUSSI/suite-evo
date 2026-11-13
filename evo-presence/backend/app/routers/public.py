from fastapi import APIRouter

from ..deps import DbSession
from ..messages import refus
from ..services import presence

router = APIRouter(tags=["public"])


@router.get("/public/bulletins/{code}")
def bulletin(code: str, db: DbSession) -> dict:
    """Le mois d'un employé, vérifiable sans compte ni numéro du chef.

    Un employé qui doute n'a pas à réclamer le cahier : il a reçu un code de
    dix signes avec son dernier récap. Le code est dérivé d'un secret du
    serveur, donc il ne se devine pas ; il ne livre que le mois qu'il désigne,
    jamais les collègues, jamais les autres services.
    """
    retrouve = presence.retrouver_code(db, code)
    if retrouve is None:
        raise refus("code_inconnu", 404)

    organisation, employe_id, periode = retrouve
    detail = presence.bulletin(db, organisation, employe_id, periode)
    return {
        "valide": True,
        "code": code.strip().upper(),
        "entreprise": organisation.nom,
        "ville": organisation.ville,
        "quartier": organisation.quartier,
        **detail,
    }
