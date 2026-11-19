from datetime import date

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..database import SessionLocal
from ..models import Organisation
from ..schemas import ReservationPublique
from ..services import hotel, present

router = APIRouter(prefix="/public", tags=["public"])


def _organisation(db) -> Organisation:
    organisation = db.scalar(select(Organisation).limit(1))
    if organisation is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "hotel_absent",
                "fr": "L'hôtel n'est pas ouvert.",
                "en": "The hotel is not open.",
            },
        )
    return organisation


@router.get("/hotel")
def fiche() -> dict:
    """La page publique : l'hôtel, son numéro, rien d'autre."""
    with SessionLocal() as db:
        return {"hotel": present.organisation_dict(_organisation(db))}


@router.get("/disponibilite")
def disponibilite(arrivee: date, depart: date) -> dict:
    """Les types de chambre libres sur la période demandée."""
    with SessionLocal() as db:
        organisation = _organisation(db)
        return {
            "arrivee": arrivee.isoformat(),
            "depart": depart.isoformat(),
            "types": hotel.types_disponibles(db, organisation, arrivee, depart),
        }


@router.post("/reservations", status_code=201)
def reserver(entree: ReservationPublique) -> dict:
    """La demande de réservation : elle dort en « demande » jusqu'à ce que
    la réception la confirme. Aucun paiement n'est pris ici."""
    with SessionLocal() as db:
        organisation = _organisation(db)
        sejour = hotel.reservation_publique(db, organisation, entree)
        return {
            "ok": True,
            "reference": sejour.id,
            "chambre_type": sejour.chambre.type,
            "prix_par_nuit": sejour.chambre.prix_par_nuit,
            "nuits": (sejour.depart - sejour.arrivee).days,
            "arrivee": sejour.arrivee.isoformat(),
            "depart": sejour.depart.isoformat(),
            "hotel": present.organisation_dict(organisation),
        }
