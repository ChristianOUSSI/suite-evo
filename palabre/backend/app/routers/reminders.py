from __future__ import annotations

from datetime import date, datetime, time

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Invoice
from ..schemas import ReminderFeedOut, RunSummaryOut, SequenceStepOut
from ..services.present import reminder_dict
from ..services.recovery import (
    CHANNEL_LABELS,
    run_due_reminders,
    sequence_for,
)
from ..utils import month_start

router = APIRouter(prefix="/reminders", tags=["relances"])


@router.get("/sequence", response_model=list[SequenceStepOut])
def get_sequence(user: CurrentUser) -> list[dict]:
    return sequence_for(user.merchant)


@router.get("", response_model=ReminderFeedOut)
def list_reminders(
    user: CurrentUser,
    db: DbSession,
    channel: str | None = Query(default=None),
    limit: int = Query(default=40, ge=1, le=200),
) -> dict:
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.merchant_id == user.merchant_id)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.reminders),
        )
    ).all()

    today_month = month_start(date.today())
    items: list[dict] = []
    sent_this_month = 0
    planned = 0

    for invoice in invoices:
        for reminder in invoice.reminders:
            if reminder.status == "planned":
                planned += 1
            if reminder.status == "sent" and reminder.sent_at:
                if reminder.sent_at.date() >= today_month:
                    sent_this_month += 1
            if channel and reminder.channel != channel:
                continue
            if reminder.status not in {"sent", "planned"}:
                continue
            data = reminder_dict(reminder)
            data.update(
                {
                    "invoice_reference": invoice.reference,
                    "customer_name": invoice.customer.name,
                }
            )
            items.append(data)

    items.sort(
        key=lambda item: (
            item["sent_at"]
            or datetime.combine(item["scheduled_on"], time.min)
        ),
        reverse=True,
    )
    return {
        "items": items[:limit],
        "sent_this_month": sent_this_month,
        "planned": planned,
    }


@router.post("/run", response_model=RunSummaryOut)
def run_reminders(
    user: CurrentUser,
    db: DbSession,
    dry_run: bool = Query(default=False),
) -> dict:
    return run_due_reminders(db, user.merchant, dry_run=dry_run)
