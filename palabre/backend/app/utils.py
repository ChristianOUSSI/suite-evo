from __future__ import annotations

import re
from datetime import UTC, date, datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .models import Invoice

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


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def format_fcfa(amount: int) -> str:
    return f"{amount:,}".replace(",", "\u202f") + "\u00a0FCFA"


def format_date_fr(value: date) -> str:
    return f"{value.day} {MOIS_FR[value.month - 1]} {value.year}"


def month_start(value: date | None = None) -> date:
    value = value or date.today()
    return value.replace(day=1)


def add_months(value: date, months: int) -> date:
    year = value.year + (value.month - 1 + months) // 12
    month = (value.month - 1 + months) % 12 + 1
    day = min(value.day, 28)
    if month == 2:
        day = min(day, 29 if year % 4 == 0 else 28)
    return date(year, month, day)


def normalize_phone(raw: str | None) -> str | None:
    """Retourne un numéro camerounais canonique : +2376XXXXXXXX."""
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("237"):
        digits = digits[3:]
    if len(digits) == 9 and digits[0] in {"2", "6"}:
        return f"+237{digits}"
    return None


def format_phone(canonical: str | None) -> str:
    if not canonical:
        return "Non renseigné"
    digits = re.sub(r"\D", "", canonical)
    if digits.startswith("237"):
        digits = digits[3:]
    if len(digits) == 9:
        return (
            f"+237 {digits[0]} {digits[1:3]} {digits[3:5]} "
            f"{digits[5:7]} {digits[7:9]}"
        )
    return canonical


def days_late(invoice: Invoice, on_date: date | None = None) -> int:
    on_date = on_date or date.today()
    return max((on_date - invoice.due_on).days, 0)


def active_promise(invoice: Invoice) -> object | None:
    for promise in invoice.promises:
        if promise.status == "active" and promise.promised_on >= date.today():
            return promise
    return None


def invoice_stage(invoice: Invoice, on_date: date | None = None) -> str:
    on_date = on_date or date.today()
    if invoice.status == "paid":
        return "paid"
    if invoice.status == "disputed":
        return "disputed"
    if active_promise(invoice):
        return "promise"
    if invoice.due_on < on_date:
        return "partial" if invoice.amount_paid > 0 else "late"
    if invoice.amount_paid > 0:
        return "partial"
    return "upcoming"


def aging_bucket(invoice: Invoice, on_date: date | None = None) -> str:
    late = days_late(invoice, on_date)
    if late == 0:
        return "upcoming"
    if late <= 15:
        return "d1_15"
    if late <= 30:
        return "d16_30"
    if late <= 60:
        return "d31_60"
    return "d60_plus"


def week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())
