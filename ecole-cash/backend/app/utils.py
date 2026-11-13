from __future__ import annotations

import re
from calendar import monthrange
from datetime import UTC, date, datetime, timedelta

MOIS_FR = (
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
)

JOURS_FR = (
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
)


def maintenant() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def canonise_telephone(brut: str | None) -> str | None:
    """Un numéro camerounais à 9 chiffres : mobile 6, fixe 2."""
    if not brut:
        return None
    chiffres = re.sub(r"\D", "", brut)
    if chiffres.startswith("00"):
        chiffres = chiffres[2:]
    if chiffres.startswith("237"):
        chiffres = chiffres[3:]
    if len(chiffres) == 9 and chiffres[0] in "267":
        return f"+237{chiffres}"
    return None


def affiche_telephone(canonical: str | None) -> str:
    """Le rythme local : 6 99 30 77 24, 2 33 42 55 18."""
    if not canonical:
        return ""
    chiffres = re.sub(r"\D", "", canonical)
    if chiffres.startswith("237"):
        chiffres = chiffres[3:]
    if len(chiffres) == 9:
        blocs = (
            chiffres[0],
            chiffres[1:3],
            chiffres[3:5],
            chiffres[5:7],
            chiffres[7:9],
        )
        return " ".join(blocs)
    return canonical


def fcfa(montant: int) -> str:
    """Un montant s'écrit avec des espaces fines, jamais de décimales."""
    texte = f"{montant:,}".replace(",", " ")
    return f"{texte} FCFA"


def jour_fr(value: date) -> str:
    quantieme = "1er" if value.day == 1 else str(value.day)
    return f"{quantieme} {MOIS_FR[value.month - 1]} {value.year}"


def jour_court_fr(value: date) -> str:
    quantieme = "1er" if value.day == 1 else str(value.day)
    return f"{JOURS_FR[value.weekday()]} {quantieme} {MOIS_FR[value.month - 1]}"


def heure_fr(moment: datetime) -> str:
    return f"{moment.hour:02d} h {moment.minute:02d}"


def depuis(moment: datetime) -> str:
    """Ce qui a été encaissé il y a combien de temps, en langage de guichet."""
    ecart = maintenant() - moment
    secondes = ecart.total_seconds()
    if secondes < 90:
        return "à l'instant"
    if secondes < 3600:
        return f"il y a {int(secondes // 60)} min"
    if secondes < 12 * 3600:
        return f"il y a {int(secondes // 3600)} h"
    return f"le {jour_fr(moment.date())}, {heure_fr(moment)}"


def ecole_annee_scolaire(value: date) -> tuple[int, int]:
    """L'année scolaire court de septembre à août, comme partout au Cameroun."""
    if value.month >= 9:
        return value.year, value.year + 1
    return value.year - 1, value.year


def annee_label(debut: int, fin: int) -> str:
    return f"{debut}/{fin}"


def ajoute_mois(value: date, mois: int) -> date:
    total = value.month - 1 + mois
    annee = value.year + total // 12
    mensuel = total % 12 + 1
    quantieme = min(value.day, monthrange(annee, mensuel)[1])
    return date(annee, mensuel, quantieme)


def jours_ecartes(debut: date, fin: date) -> int:
    return (fin - debut).days
