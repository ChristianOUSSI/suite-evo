from __future__ import annotations

import re
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

ESPACE_FIN = "\u202f"


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


def affiche_telephone(brut: str | None) -> str:
    """Le numéro rendu tel qu'on le lit au téléphone : 6 99 30 77 24."""
    canonical = canonise_telephone(brut)
    if not canonical:
        return brut or ""
    no = canonical[4:]
    # Le premier chiffre se détache, la suite se dit par deux : 6 99 30 77 24.
    groupes = [no[0]] + [no[i : i + 2] for i in range(1, len(no), 2)]
    return " ".join(groupes)


def fcfa(montant: int) -> str:
    """Un montant de comptoir : séparés de milliers, pas de décimales."""
    signe = "-" if montant < 0 else ""
    groupes = f"{abs(int(montant)):,}".replace(",", ESPACE_FIN)
    return f"{signe}{groupes}{ESPACE_FIN}FCFA"


def jour_label(jour: date) -> str:
    return f"{JOURS_FR[jour.weekday()]} {jour.day} {MOIS_FR[jour.month - 1]} {jour.year}"


def jour_court(jour: date) -> str:
    return f"{JOURS_FR[jour.weekday()][:3]} {jour.day:02d} {MOIS_FR[jour.month - 1][:4]}."


def debut_semaine(jour: date) -> date:
    return jour - timedelta(days=jour.weekday())


def semaine_label(jour: date) -> str:
    debut = debut_semaine(jour)
    fin = debut + timedelta(days=6)
    if debut.month == fin.month:
        return f"semaine du {debut.day} au {fin.day} {MOIS_FR[debut.month - 1]}"
    return (
        f"semaine du {debut.day} {MOIS_FR[debut.month - 1]} "
        f"au {fin.day} {MOIS_FR[fin.month - 1]}"
    )


def mois_label(jour: date) -> str:
    return f"{MOIS_FR[jour.month - 1]} {jour.year}"
