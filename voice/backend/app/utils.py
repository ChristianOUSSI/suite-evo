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

MOIS_EN = (
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
)

JOURS_EN = (
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
)


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def normalize_phone(raw: str | None) -> str | None:
    """Canonise un numéro camerounais à 9 chiffres : mobile 6 ou 7, fixe 2."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("237"):
        digits = digits[3:]
    if len(digits) == 9 and digits[0] in "267":
        return f"+237{digits}"
    return None


def format_phone(canonical: str | None) -> str:
    """Rend le numéro au rythme local : 6 77 08 41 96, 2 33 30 40 51."""
    if not canonical:
        return ""
    digits = re.sub(r"\D", "", canonical)
    if digits.startswith("237"):
        digits = digits[3:]
    if len(digits) == 9:
        return f"{digits[0]} {digits[1:3]} {digits[3:5]} {digits[5:7]} {digits[7:9]}"
    return canonical


def format_hours(moment: datetime) -> str:
    return f"{moment.hour:02d} h {moment.minute:02d}"


def format_clock(value) -> str:
    return f"{value.hour:02d} h {value.minute:02d}" if value else ""


def format_date_fr(value: date) -> str:
    jour = "1er" if value.day == 1 else str(value.day)
    return f"{jour} {MOIS_FR[value.month - 1]} {value.year}"


def format_day_fr(value: date) -> str:
    jour = "1er" if value.day == 1 else str(value.day)
    return f"{JOURS_FR[value.weekday()]} {jour} {MOIS_FR[value.month - 1]}"


def format_day_en(value: date) -> str:
    return f"{JOURS_EN[value.weekday()]} {value.day} {MOIS_EN[value.month - 1]}"


def format_clock_en(value) -> str:
    return f"{value.hour:02d}:{value.minute:02d}" if value else ""


def format_duration(seconds: int) -> str:
    if seconds < 60:
        return f"{seconds} s"
    minutes, rest = divmod(seconds, 60)
    return f"{minutes} min {rest:02d} s" if rest else f"{minutes} min"


def relative_time(moment: datetime) -> str:
    """Une durée écoulée, dans la langue d'une main courante."""
    delta = utcnow() - moment
    if delta.total_seconds() < 90:
        return "à l'instant"
    if delta.total_seconds() < 3600:
        return f"il y a {int(delta.total_seconds() // 60)} min"
    if delta.total_seconds() < 6 * 3600:
        hours = int(delta.total_seconds() // 3600)
        return f"il y a {hours} h"
    return f"le {format_date_fr(moment.date())}, {moment.hour:02d} h"


def add_working_minutes(moment: datetime, minutes: int) -> datetime:
    return moment + timedelta(minutes=minutes)
