"""La caisse de l'école : ce qui est rentré, et ce qu'elle dit avoir en main."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Echeance, Ecole, Journee, Paiement
from . import encaissement

ESPECES = "especes"


def entries_du_jour(db: Session, ecole: Ecole, jour: date) -> list[Paiement]:
    ce_jour = func.strftime("%Y-%m-%d", Paiement.moment) == jour.isoformat()
    return list(
        db.scalars(
            select(Paiement)
            .where(Paiement.ecole_id == ecole.id, ce_jour, Paiement.annule.is_(False))
            .order_by(Paiement.moment)
        )
    )


def par_mode(entries: list[Paiement]) -> dict[str, int]:
    total: dict[str, int] = {}
    for entree in entries:
        total[entree.mode] = total.get(entree.mode, 0) + entree.montant
    return total


def especes_du_jour(entries: list[Paiement]) -> int:
    return sum(e.montant for e in entries if e.mode == ESPECES)


def journee(db: Session, ecole: Ecole, jour: date) -> Journee | None:
    return db.scalar(
        select(Journee).where(Journee.ecole_id == ecole.id, Journee.jour == jour)
    )


def attendu(db: Session, ecole: Ecole, jour: date) -> int:
    """Ce que la caisse doit contenir : le fond du matin plus les espèces du jour."""
    ouverte = journee(db, ecole, jour)
    fond = ouverte.fond if ouverte else 0
    return fond + especes_du_jour(entries_du_jour(db, ecole, jour))


def etat(db: Session, ecole: Ecole, jour: date) -> dict:
    entries = entries_du_jour(db, ecole, jour)
    ouverte = journee(db, ecole, jour)
    fond = ouverte.fond if ouverte else 0
    total = sum(entree.montant for entree in entries)
    especes = especes_du_jour(entries)
    attendu_caisse = fond + especes
    ecart = (
        ouverte.comptage - attendu_caisse
        if ouverte and ouverte.declaree
        else None
    )
    return {
        "jour": jour.isoformat(),
        "nb_entries": len(entries),
        "total": total,
        "especes": especes,
        "hors_especes": total - especes,
        "par_mode": {
            encaissement.MODES.get(mode, mode): montant
            for mode, montant in par_mode(entries).items()
        },
        "fond": fond,
        "attendu": attendu_caisse,
        "comptage": ouverte.comptage if ouverte and ouverte.declaree else None,
        "ecart": ecart,
        "declaree": bool(ouverte and ouverte.declaree),
        "tenu_par": ouverte.tenu_par if ouverte else "",
    }


def declarer(
    db: Session,
    ecole: Ecole,
    jour: date,
    fond: int,
    comptage: int,
    tenu_par: str,
    note: str,
) -> Journee:
    """Le comptage du soir, comparé à ce que la caisse annonçait."""
    ouverte = journee(db, ecole, jour)
    if not ouverte:
        ouverte = Journee(ecole_id=ecole.id, jour=jour)
        db.add(ouverte)
    ouverte.fond = fond
    ouverte.comptage = comptage
    ouverte.tenu_par = tenu_par.strip()
    ouverte.note = note.strip()
    ouverte.declaree = True
    db.commit()
    return ouverte


def serie(db: Session, ecole: Ecole, jours: int = 7) -> list[dict]:
    """Sept jours d'encaissement, pour voir la semaine se remplir."""
    today = date.today()
    feuille = []
    for decalage in range(jours - 1, -1, -1):
        jour = today - timedelta(days=decalage)
        entries = entries_du_jour(db, ecole, jour)
        feuille.append(
            {
                "day": jour.isoformat(),
                "total": sum(e.montant for e in entries),
                "especes": especes_du_jour(entries),
                "entries": len(entries),
            }
        )
    return feuille


def recouvrement(db: Session, ecole: Ecole) -> dict:
    """Ce qui était attendu sur l'année et ce qui est réellement rentré."""
    lignes = db.scalars(select(Echeance).where(Echeance.ecole_id == ecole.id)).all()
    du = sum(ligne.montant for ligne in lignes)
    rentre = sum(ligne.impute for ligne in lignes)
    return {
        "attendu": du,
        "rentre": rentre,
        "reste": max(0, du - rentre),
        "part": round(100 * rentre / du) if du else 0,
    }
