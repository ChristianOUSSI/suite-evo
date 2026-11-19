from __future__ import annotations

import re
from datetime import UTC, date, datetime, timedelta, timezone

MOIS_FR = (
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
)
MOIS_EN = (
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)
JOURS_FR = ("lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche")
JOURS_EN = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")

ESPACE_FIN = "\u202f"


def maintenant() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def canonise_telephone(brut: str | None) -> str | None:
    """Neuf chiffres camerounais : mobile 6, fixe 2. Tout le reste est refusé."""
    if not brut:
        return None
    chiffres = re.sub(r"\D", "", brut)
    if chiffres.startswith("00"):
        chiffres = chiffres[2:]
    if chiffres.startswith("237") and len(chiffres) > 9:
        chiffres = chiffres[3:]
    if chiffres.startswith("0") and len(chiffres) == 10:
        chiffres = chiffres[1:]
    if len(chiffres) != 9 or chiffres[0] not in "267":
        return None
    return f"+237{chiffres}"


def affiche_telephone(brut: str | None) -> str:
    canonique = canonise_telephone(brut)
    if not canonique:
        return brut or ""
    no = canonique[4:]
    return " ".join([no[0], no[1:3], no[3:5], no[5:7], no[7:9]])


def operateur(brut: str | None) -> str:
    """Plage des trois premiers chiffres. Indicatif : la portabilité existe."""
    canonique = canonise_telephone(brut)
    if not canonique:
        return "inconnu"
    no = canonique[4:]
    if no[0] == "2":
        return "Camtel (fixe)"
    tete = int(no[:3])
    if 650 <= tete <= 654 or 670 <= tete <= 679:
        return "MTN"
    if 640 <= tete <= 642 or 655 <= tete <= 659 or 686 <= tete <= 689 or 690 <= tete <= 699:
        return "Orange"
    if 660 <= tete <= 669:
        return "Nexttel"
    return "mobile"


def fcfa(montant: int, langue: str = "fr") -> str:
    valeur = round(int(montant or 0))
    signe = "-" if valeur < 0 else ""
    groupes = f"{abs(valeur):,}".replace(",", ESPACE_FIN if langue != "en" else ",")
    return f"{signe}{groupes}{ESPACE_FIN}FCFA"


def date_longue(jour: date, langue: str = "fr") -> str:
    if langue == "en":
        return f"{MOIS_EN[jour.month - 1]} {jour.day}, {jour.year}"
    return f"{jour.day} {MOIS_FR[jour.month - 1]} {jour.year}"


def jour_et_date(jour: date, langue: str = "fr") -> str:
    table = JOURS_EN if langue == "en" else JOURS_FR
    return f"{table[jour.weekday()]}, {date_longue(jour, langue)}"


def aujourdhui() -> date:
    """Le jour lu à Douala : le Cameroun n'a pas d'heure d'été, UTC+1 fixe."""
    return datetime.now(timezone(timedelta(hours=1))).date()


def dans_jours(n: int, depuis: date | None = None) -> date:
    return (depuis or aujourdhui()) + timedelta(days=n)


def jours_depuis(jour: date | None, ce_jour: date | None = None) -> int | None:
    """Combien de jours sans nouvelles. Rien sans date : pas de zéro trompeur."""
    if jour is None:
        return None
    return (ce_jour or aujourdhui() - jour).days
