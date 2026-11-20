from fastapi import APIRouter

from ..deps import DbSession
from ..messages import refus
from ..schemas import PointageKiosque
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


@router.get("/public/pointage")
def ecran_pointage(db: DbSession) -> dict:
    """L'écran partagé de l'entrée : le nom de la maison, rien d'autre."""
    from sqlalchemy import select

    from ..models import Organisation

    organisation = db.scalar(select(Organisation).limit(1))
    if organisation is None:
        return {"entreprise": None}
    return {
        "entreprise": {
            "nom": organisation.nom,
            "ville": organisation.ville,
            "quartier": organisation.quartier,
        }
    }


@router.post("/public/pointage", status_code=201)
def pointer(db: DbSession, entree: PointageKiosque) -> dict:
    """Le pointage de l'écran partagé : code, geste, heure - pas de compte."""
    ligne = presence.pointer_kiosque(db, entree.code, entree.geste, entree.heure)
    return {
        "ok": True,
        "employe": ligne.employe.nom,
        "jour": ligne.jour.isoformat(),
        "statut": ligne.statut,
        "arrivee": ligne.arrivee,
        "depart": ligne.depart,
    }
