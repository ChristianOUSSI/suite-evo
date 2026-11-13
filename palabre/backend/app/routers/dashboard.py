from collections import defaultdict
from datetime import date, datetime, time, timedelta

from fastapi import APIRouter
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from ..deps import CurrentUser, DbSession
from ..models import Customer, Invoice, Payment
from ..schemas import DashboardOut
from ..services.recovery import STAGE_LABELS
from ..utils import (
    aging_bucket,
    days_late,
    invoice_stage,
    month_start,
    week_start,
)

router = APIRouter(tags=["tableau de bord"])

AGING_META = [
    ("upcoming", "À échoir"),
    ("d1_15", "1 à 15 jours"),
    ("d16_30", "16 à 30 jours"),
    ("d31_60", "31 à 60 jours"),
    ("d60_plus", "60 jours et +"),
]

ACTIVITY_LIMIT = 8


@router.get("/dashboard", response_model=DashboardOut)
def get_dashboard(user: CurrentUser, db: DbSession) -> dict:
    merchant = user.merchant
    today = date.today()

    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.merchant_id == merchant.id)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.reminders),
            selectinload(Invoice.payments),
            selectinload(Invoice.promises),
        )
    ).all()

    open_invoices = [
        invoice
        for invoice in invoices
        if invoice.status == "open" and invoice.remaining > 0
    ]
    overdue = [invoice for invoice in open_invoices if invoice.due_on < today]

    outstanding = sum(invoice.remaining for invoice in open_invoices)
    overdue_amount = sum(invoice.remaining for invoice in overdue)

    start = month_start(today)
    payments = [
        payment
        for invoice in invoices
        for payment in invoice.payments
        if payment.status == "confirmed"
    ]
    month_payments = [
        payment for payment in payments if payment.paid_at.date() >= start
    ]
    collected_month = sum(payment.amount for payment in month_payments)
    fees_month = sum(payment.fee_amount for payment in month_payments)

    planned_today = 0
    planned_channels: dict[str, int] = defaultdict(int)
    for invoice in open_invoices:
        if invoice.customer.opt_out:
            continue
        for reminder in invoice.reminders:
            if reminder.status == "planned" and reminder.scheduled_on <= today:
                planned_today += 1
                planned_channels[reminder.channel] += 1

    promises_due = sum(
        1
        for invoice in open_invoices
        for promise in invoice.promises
        if promise.status == "active" and promise.promised_on <= today
    )
    promise_count = sum(
        1 for invoice in open_invoices if invoice_stage(invoice) == "promise"
    )

    customers_count = (
        db.scalar(
            select(func.count(Customer.id)).where(
                Customer.merchant_id == merchant.id
            )
        )
        or 0
    )

    aging_counts: dict[str, dict] = {
        key: {"key": key, "label": label, "count": 0, "amount": 0}
        for key, label in AGING_META
    }
    for invoice in open_invoices:
        bucket = aging_bucket(invoice)
        aging_counts[bucket]["count"] += 1
        aging_counts[bucket]["amount"] += invoice.remaining

    priorities = sorted(
        overdue,
        key=lambda invoice: (days_late(invoice), invoice.remaining),
        reverse=True,
    )[:5]
    priority_items = [
        {
            "reference": invoice.reference,
            "customer_name": invoice.customer.name,
            "remaining": invoice.remaining,
            "due_on": invoice.due_on,
            "days_late": days_late(invoice),
            "stage": invoice_stage(invoice),
            "stage_label": STAGE_LABELS[invoice_stage(invoice)],
            "last_contact_at": max(
                (
                    reminder.sent_at
                    for reminder in invoice.reminders
                    if reminder.sent_at
                ),
                default=None,
            ),
            "promise_on": max(
                (
                    promise.promised_on
                    for promise in invoice.promises
                    if promise.status == "active"
                    and promise.promised_on >= today
                ),
                default=None,
            ),
        }
        for invoice in priorities
    ]

    events: list[dict] = []
    for invoice in invoices:
        for payment in invoice.payments:
            events.append(
                {
                    "id": f"payment-{payment.id}",
                    "type": "payment",
                    "customer_name": invoice.customer.name,
                    "invoice_reference": invoice.reference,
                    "channel": payment.method,
                    "amount": payment.amount,
                    "at": payment.paid_at,
                    "status": payment.status,
                }
            )
        for reminder in invoice.reminders:
            if not reminder.sent_at:
                continue
            events.append(
                {
                    "id": f"reminder-{reminder.id}",
                    "type": "reminder",
                    "customer_name": invoice.customer.name,
                    "invoice_reference": invoice.reference,
                    "channel": reminder.channel,
                    "amount": None,
                    "at": reminder.sent_at,
                    "status": reminder.status,
                }
            )
        for promise in invoice.promises:
            events.append(
                {
                    "id": f"promise-{promise.id}",
                    "type": "promise",
                    "customer_name": invoice.customer.name,
                    "invoice_reference": invoice.reference,
                    "channel": None,
                    "amount": promise.amount,
                    "at": promise.created_at,
                    "status": promise.status,
                }
            )
    events.sort(key=lambda event: event["at"], reverse=True)

    current_week = week_start(today)
    weeks = [current_week - timedelta(weeks=offset) for offset in range(7, -1, -1)]
    weekly = {week: 0 for week in weeks}
    for payment in payments:
        paid_week = week_start(payment.paid_at.date())
        if paid_week in weekly:
            weekly[paid_week] += payment.amount
    collections = [
        {"week_start": week, "amount": amount} for week, amount in weekly.items()
    ]

    late_days = [days_late(invoice) for invoice in overdue]
    average_days_late = round(sum(late_days) / len(late_days)) if late_days else 0

    return {
        "as_of": today,
        "merchant_name": merchant.name,
        "stats": {
            "outstanding": outstanding,
            "overdue": overdue_amount,
            "collected_month": collected_month,
            "fees_month": fees_month,
            "monthly_target": merchant.monthly_target,
            "monthly_progress": (
                min(100, round(collected_month / merchant.monthly_target * 100))
                if merchant.monthly_target
                else 0
            ),
            "recovery_rate": (
                round(collected_month / (collected_month + overdue_amount) * 100)
                if collected_month + overdue_amount
                else 0
            ),
            "open_count": len(open_invoices),
            "late_count": len(overdue),
            "promise_count": promise_count,
            "customers_count": customers_count,
            "planned_today": planned_today,
            "planned_channels": dict(planned_channels),
            "promises_due": promises_due,
            "average_days_late": average_days_late,
        },
        "aging": [aging_counts[key] for key, _ in AGING_META],
        "priorities": priority_items,
        "activity": events[:ACTIVITY_LIMIT],
        "collections": collections,
    }
