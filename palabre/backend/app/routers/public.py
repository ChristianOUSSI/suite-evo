from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import DbSession
from ..models import Invoice
from ..schemas import PublicInvoiceOut, PublicPayIn, ReceiptOut
from ..services.payments import PaymentError, record_payment
from ..services.present import public_invoice_dict, receipt_dict

router = APIRouter(prefix="/public", tags=["portail client"])


def _invoice_by_token(db, token: str) -> Invoice:
    invoice = db.scalar(
        select(Invoice)
        .where(Invoice.access_token == token)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.merchant),
            selectinload(Invoice.promises),
            selectinload(Invoice.payments),
            selectinload(Invoice.reminders),
        )
    )
    if not invoice:
        raise HTTPException(
            status_code=404,
            detail="Ce lien de paiement n'est plus valide.",
        )
    return invoice


@router.get("/invoices/{token}", response_model=PublicInvoiceOut)
def get_public_invoice(token: str, db: DbSession) -> dict:
    invoice = _invoice_by_token(db, token)
    return public_invoice_dict(invoice)


@router.post(
    "/invoices/{token}/pay",
    response_model=ReceiptOut,
    status_code=status.HTTP_201_CREATED,
)
def pay_public_invoice(
    token: str, payload: PublicPayIn, db: DbSession
) -> dict:
    invoice = _invoice_by_token(db, token)
    if invoice.status != "open":
        raise HTTPException(
            status_code=409,
            detail="Cette facture est déjà réglée ou en litige.",
        )

    try:
        payment = record_payment(
            db,
            invoice,
            amount=payload.amount,
            method=payload.method,
            phone=payload.phone,
        )
    except PaymentError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

    return receipt_dict(payment, invoice)
