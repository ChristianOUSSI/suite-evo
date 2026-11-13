from __future__ import annotations

from datetime import date

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Invoice, PromiseToPay
from ..schemas import (
    DirectReminderOut,
    ImportCheckOut,
    ImportRequest,
    ImportResultOut,
    InvoiceCreate,
    InvoiceDetailOut,
    InvoiceListOut,
    InvoiceStatusPatch,
    PromiseCreate,
    PromiseOut,
)
from ..services.invoice_service import (
    create_invoice_record,
    find_duplicate_invoice,
    find_invoice,
)
from ..services.present import (
    invoice_detail_dict,
    invoice_summary_dict,
    promise_dict,
    reminder_dict,
)
from ..services.recovery import (
    cancel_planned_reminders,
    send_direct_reminder,
    sync_invoice_reminders,
)
from ..utils import invoice_stage

router = APIRouter(prefix="/invoices", tags=["créances"])


def _invoice_or_404(db, merchant_id: int, reference: str) -> Invoice:
    invoice = find_invoice(db, merchant_id, reference)
    if not invoice:
        raise HTTPException(
            status_code=404, detail="Cette créance n'existe pas."
        )
    return invoice


@router.get("", response_model=InvoiceListOut)
def list_invoices(
    user: CurrentUser,
    db: DbSession,
    stage: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=120),
) -> dict:
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.merchant_id == user.merchant_id)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.reminders),
            selectinload(Invoice.promises),
        )
        .order_by(Invoice.due_on.asc(), Invoice.id.desc())
    ).all()

    counts = {
        "all": len(invoices),
        "late": 0,
        "promise": 0,
        "upcoming": 0,
        "partial": 0,
        "paid": 0,
        "disputed": 0,
    }
    stage_map: dict[int, str] = {}
    for invoice in invoices:
        computed = invoice_stage(invoice)
        stage_map[invoice.id] = computed
        counts[computed] = counts.get(computed, 0) + 1

    filtered = invoices
    if q:
        needle = q.strip().lower()
        filtered = [
            invoice
            for invoice in filtered
            if needle in invoice.reference.lower()
            or needle in invoice.label.lower()
            or needle in invoice.customer.name.lower()
            or needle in invoice.customer.phone
        ]
    if stage and stage != "all":
        filtered = [
            invoice
            for invoice in filtered
            if stage_map[invoice.id] == stage
        ]

    total_outstanding = sum(
        invoice.remaining
        for invoice in invoices
        if invoice.status == "open" and invoice.remaining > 0
    )
    total_late = sum(
        invoice.remaining
        for invoice in invoices
        if invoice.status == "open"
        and invoice.remaining > 0
        and invoice.due_on < date.today()
    )

    return {
        "items": [invoice_summary_dict(invoice) for invoice in filtered],
        "counts": counts,
        "total_outstanding": total_outstanding,
        "total_late": total_late,
        "total_count": len(invoices),
    }


@router.post("/import/check", response_model=ImportCheckOut)
def check_import(
    payload: ImportRequest, user: CurrentUser, db: DbSession
) -> dict:
    duplicates: list[dict] = []
    seen: set[tuple] = set()

    for index, row in enumerate(payload.rows):
        existing = find_duplicate_invoice(
            db,
            user.merchant_id,
            phone=row.phone,
            label=row.label,
            amount_due=row.amount_due,
            due_on=row.due_on,
        )
        key = (
            row.phone,
            row.label.strip().casefold(),
            row.amount_due,
            row.due_on,
        )
        if existing:
            duplicates.append(
                {"row": index + 1, "reference": existing.reference}
            )
        elif key in seen:
            duplicates.append({"row": index + 1, "reference": None})
        else:
            seen.add(key)

    return {"duplicates": duplicates}


@router.post("/import", response_model=ImportResultOut, status_code=201)
def import_invoices(
    payload: ImportRequest, user: CurrentUser, db: DbSession
) -> dict:
    imported: list[str] = []
    errors: list[dict] = []
    seen: set[tuple] = set()

    for index, row in enumerate(payload.rows):
        key = (
            row.phone,
            row.label.strip().casefold(),
            row.amount_due,
            row.due_on,
        )
        if key in seen:
            errors.append(
                {
                    "row": index + 1,
                    "message": "Doublon dans le fichier, ligne écartée.",
                }
            )
            continue
        existing = find_duplicate_invoice(
            db,
            user.merchant_id,
            phone=row.phone,
            label=row.label,
            amount_due=row.amount_due,
            due_on=row.due_on,
        )
        if existing:
            errors.append(
                {
                    "row": index + 1,
                    "message": f"Déjà au carnet sous {existing.reference}.",
                }
            )
            continue
        try:
            invoice = create_invoice_record(
                db,
                user.merchant,
                customer_name=row.customer_name,
                phone=row.phone,
                label=row.label,
                amount_due=row.amount_due,
                due_on=row.due_on,
                quartier=row.quartier,
                notes=row.notes,
            )
            imported.append(invoice.reference)
            seen.add(key)
        except ValueError as error:
            errors.append({"row": index + 1, "message": str(error)})

    db.commit()
    return {
        "imported": len(imported),
        "skipped": len(errors),
        "errors": errors,
        "invoices": imported,
    }


@router.post("", response_model=InvoiceDetailOut, status_code=201)
def create_invoice(
    payload: InvoiceCreate, user: CurrentUser, db: DbSession
) -> dict:
    invoice = create_invoice_record(
        db,
        user.merchant,
        customer_name=payload.customer_name,
        phone=payload.phone,
        label=payload.label,
        amount_due=payload.amount_due,
        due_on=payload.due_on,
        quartier=payload.quartier,
        notes=payload.notes,
    )
    db.commit()
    refreshed = _invoice_or_404(db, user.merchant_id, invoice.reference)
    return invoice_detail_dict(refreshed)


@router.get("/{reference}", response_model=InvoiceDetailOut)
def get_invoice(
    reference: str, user: CurrentUser, db: DbSession
) -> dict:
    invoice = _invoice_or_404(db, user.merchant_id, reference)
    return invoice_detail_dict(invoice)


@router.post("/{reference}/remind", response_model=DirectReminderOut)
def remind_invoice(
    reference: str, user: CurrentUser, db: DbSession
) -> dict:
    invoice = _invoice_or_404(db, user.merchant_id, reference)
    try:
        reminder = send_direct_reminder(db, invoice)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error

    return {
        "reminder": reminder_dict(reminder),
        "invoice_reference": invoice.reference,
        "customer_name": invoice.customer.name,
    }


@router.post(
    "/{reference}/promise", response_model=PromiseOut, status_code=201
)
def record_promise(
    reference: str,
    payload: PromiseCreate,
    user: CurrentUser,
    db: DbSession,
) -> dict:
    invoice = _invoice_or_404(db, user.merchant_id, reference)
    if invoice.status != "open":
        raise HTTPException(
            status_code=409, detail="Cette créance n'est plus ouverte."
        )
    if payload.amount > invoice.remaining:
        raise HTTPException(
            status_code=422,
            detail="La promesse dépasse le solde restant.",
        )
    if payload.promised_on < date.today():
        raise HTTPException(
            status_code=422,
            detail="La date de promesse ne peut pas être passée.",
        )

    for existing in invoice.promises:
        if existing.status == "active":
            existing.status = "replaced"

    promise = PromiseToPay(
        invoice_id=invoice.id,
        amount=payload.amount,
        promised_on=payload.promised_on,
        note=payload.note.strip(),
        status="active",
    )
    db.add(promise)
    db.commit()
    db.refresh(promise)
    return promise_dict(promise)


@router.patch("/{reference}/status", response_model=InvoiceDetailOut)
def update_status(
    reference: str,
    payload: InvoiceStatusPatch,
    user: CurrentUser,
    db: DbSession,
) -> dict:
    invoice = _invoice_or_404(db, user.merchant_id, reference)
    if invoice.status == "paid":
        raise HTTPException(
            status_code=409, detail="Une créance réglée ne peut pas être rouverte."
        )

    invoice.status = payload.status
    if payload.status == "disputed":
        cancel_planned_reminders(invoice)
    else:
        sync_invoice_reminders(db, invoice)
    db.commit()
    refreshed = _invoice_or_404(db, user.merchant_id, reference)
    return invoice_detail_dict(refreshed)
