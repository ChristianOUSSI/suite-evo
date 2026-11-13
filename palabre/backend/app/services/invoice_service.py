from __future__ import annotations

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..models import Customer, Invoice, Merchant
from ..utils import normalize_phone
from .recovery import new_access_token, next_reference, sync_invoice_reminders


def ensure_customer(
    db: Session,
    merchant: Merchant,
    *,
    name: str,
    phone: str,
    quartier: str = "",
) -> Customer:
    canonical = normalize_phone(phone)
    if not canonical:
        raise ValueError("Numéro de téléphone invalide.")
    customer = db.scalar(
        select(Customer).where(
            Customer.merchant_id == merchant.id,
            Customer.phone == canonical,
        )
    )
    if customer:
        if quartier and not customer.quartier:
            customer.quartier = quartier
        return customer

    customer = Customer(
        merchant_id=merchant.id,
        name=name.strip(),
        phone=canonical,
        quartier=quartier.strip(),
    )
    db.add(customer)
    db.flush()
    return customer


def create_invoice_record(
    db: Session,
    merchant: Merchant,
    *,
    customer_name: str,
    phone: str,
    label: str,
    amount_due: int,
    due_on: date,
    quartier: str = "",
    notes: str = "",
    reserved: int = 0,
) -> Invoice:
    customer = ensure_customer(
        db, merchant, name=customer_name, phone=phone, quartier=quartier
    )
    invoice = Invoice(
        merchant_id=merchant.id,
        customer_id=customer.id,
        reference=next_reference(db, merchant, reserved=reserved),
        label=label.strip(),
        amount_due=amount_due,
        amount_paid=0,
        issued_on=date.today(),
        due_on=due_on,
        status="open",
        access_token=new_access_token(),
        notes=notes.strip(),
    )
    invoice.merchant = merchant
    invoice.customer = customer
    db.add(invoice)
    db.flush()

    sync_invoice_reminders(db, invoice)
    db.flush()
    return invoice


def find_duplicate_invoice(
    db: Session,
    merchant_id: int,
    *,
    phone: str,
    label: str,
    amount_due: int,
    due_on: date,
) -> Invoice | None:
    canonical = normalize_phone(phone)
    if not canonical:
        return None
    candidates = db.scalars(
        select(Invoice)
        .join(Customer)
        .where(
            Invoice.merchant_id == merchant_id,
            Customer.phone == canonical,
            Invoice.amount_due == amount_due,
            Invoice.due_on == due_on,
        )
        .order_by(Invoice.id.asc())
    ).all()
    wanted = label.strip().casefold()
    for invoice in candidates:
        if invoice.label.strip().casefold() == wanted:
            return invoice
    return None


def find_invoice(
    db: Session, merchant_id: int, reference: str
) -> Invoice | None:
    return db.scalar(
        select(Invoice)
        .where(
            Invoice.merchant_id == merchant_id,
            Invoice.reference == reference,
        )
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.merchant),
            selectinload(Invoice.reminders),
            selectinload(Invoice.payments),
            selectinload(Invoice.promises),
        )
    )
