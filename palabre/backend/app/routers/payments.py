from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Invoice
from ..schemas import ManualPaymentIn, PaymentFeedOut, ReceiptOut
from ..services.invoice_service import find_invoice
from ..services.payments import METHOD_LABELS, PaymentError, record_payment
from ..services.present import payment_dict, receipt_dict
from ..utils import normalize_phone

router = APIRouter(tags=["encaissements"])


@router.get("/payments", response_model=PaymentFeedOut)
def list_payments(
    user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=60, ge=1, le=200),
) -> dict:
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.merchant_id == user.merchant_id)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.payments),
        )
    ).all()

    items: list[dict] = []
    for invoice in invoices:
        for payment in invoice.payments:
            if payment.status != "confirmed":
                continue
            data = payment_dict(payment)
            data.update(
                {
                    "invoice_reference": invoice.reference,
                    "customer_name": invoice.customer.name,
                }
            )
            items.append(data)

    items.sort(key=lambda item: item["paid_at"], reverse=True)
    return {
        "items": items[:limit],
        "total": sum(item["amount"] for item in items),
        "fees": sum(item["fee_amount"] for item in items),
        "count": len(items),
    }


@router.post(
    "/invoices/{reference}/payments",
    response_model=ReceiptOut,
    status_code=status.HTTP_201_CREATED,
)
def record_manual_payment(
    reference: str,
    payload: ManualPaymentIn,
    user: CurrentUser,
    db: DbSession,
) -> dict:
    invoice = find_invoice(db, user.merchant_id, reference)
    if not invoice:
        raise HTTPException(status_code=404, detail="Cette créance n'existe pas.")

    phone = ""
    if payload.method != "cash":
        raw_phone = payload.phone or invoice.customer.phone
        phone = normalize_phone(raw_phone) or ""
        if not phone:
            raise HTTPException(
                status_code=422, detail="Numéro mobile invalide."
            )

    try:
        payment = record_payment(
            db,
            invoice,
            amount=payload.amount,
            method=payload.method,
            phone=phone,
        )
    except PaymentError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

    return receipt_dict(payment, invoice)
