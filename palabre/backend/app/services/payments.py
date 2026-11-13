from __future__ import annotations

import secrets
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from ..models import Invoice, Payment
from ..utils import utcnow
from .recovery import cancel_planned_reminders, refresh_planned_bodies

FEE_RATE = 0.03
SUBSCRIPTION = 35_000
METHOD_LABELS = {
    "momo_mtn": "MTN MoMo",
    "momo_orange": "Orange Money",
    "cash": "Espèces",
}


class PaymentError(ValueError):
    pass


def calculate_fee(amount: int) -> int:
    return round(amount * FEE_RATE)


def record_payment(
    db: Session,
    invoice: Invoice,
    amount: int,
    method: str,
    phone: str = "",
) -> Payment:
    if invoice.status != "open":
        raise PaymentError("Cette facture n'est plus ouverte au règlement.")
    if amount <= 0:
        raise PaymentError("Le montant doit être supérieur à zéro.")
    if amount > invoice.remaining:
        raise PaymentError("Le montant dépasse le solde restant.")
    if method not in METHOD_LABELS:
        raise PaymentError("Moyen de paiement inconnu.")

    reference = (
        f"RCV-{datetime.now(UTC):%Y%m%d}-"
        f"{secrets.token_hex(3).upper()}"
    )
    payment = Payment(
        invoice_id=invoice.id,
        amount=amount,
        fee_amount=calculate_fee(amount),
        method=method,
        reference=reference,
        phone=phone,
        status="confirmed",
        paid_at=utcnow(),
    )
    invoice.amount_paid = min(invoice.amount_due, invoice.amount_paid + amount)
    db.add(payment)

    if invoice.remaining == 0:
        invoice.status = "paid"
        cancel_planned_reminders(invoice)
        for promise in invoice.promises:
            if promise.status == "active":
                promise.status = "kept"
    else:
        refresh_planned_bodies(invoice)

    db.commit()
    db.refresh(payment)
    return payment
