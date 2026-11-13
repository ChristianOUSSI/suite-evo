from __future__ import annotations

from datetime import datetime, time

from ..config import settings
from ..models import Customer, Invoice, Merchant, Payment, PromiseToPay, Reminder, User
from ..utils import (
    active_promise,
    days_late,
    format_phone,
    invoice_stage,
)
from .payments import METHOD_LABELS
from .recovery import CHANNEL_LABELS, STAGE_LABELS, step_label


def merchant_dict(merchant: Merchant) -> dict:
    return {
        "id": merchant.id,
        "name": merchant.name,
        "owner_name": merchant.owner_name,
        "phone": merchant.phone,
        "phone_display": format_phone(merchant.phone),
        "city": merchant.city,
        "quartier": merchant.quartier,
        "plan": merchant.plan,
        "monthly_target": merchant.monthly_target,
        "tone": merchant.tone,
        "sms_enabled": merchant.sms_enabled,
        "whatsapp_enabled": merchant.whatsapp_enabled,
        "voice_enabled": merchant.voice_enabled,
        "auto_reminders": merchant.auto_reminders,
        "daily_report": merchant.daily_report,
    }


def session_dict(user: User) -> dict:
    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
        },
        "merchant": merchant_dict(user.merchant),
        "demo": settings.demo_mode,
    }


def customer_dict(customer: Customer) -> dict:
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "phone_display": format_phone(customer.phone),
        "quartier": customer.quartier,
        "opt_out": customer.opt_out,
    }


def reminder_dict(reminder: Reminder) -> dict:
    return {
        "id": reminder.id,
        "channel": reminder.channel,
        "channel_label": CHANNEL_LABELS.get(reminder.channel, reminder.channel),
        "step_code": reminder.step_code,
        "step_label": step_label(reminder.step_code),
        "body": reminder.body,
        "tone": reminder.tone,
        "scheduled_on": reminder.scheduled_on,
        "sent_at": reminder.sent_at,
        "status": reminder.status,
    }


def payment_dict(payment: Payment) -> dict:
    return {
        "id": payment.id,
        "amount": payment.amount,
        "fee_amount": payment.fee_amount,
        "method": payment.method,
        "method_label": METHOD_LABELS.get(payment.method, payment.method),
        "reference": payment.reference,
        "phone": payment.phone,
        "phone_display": (
            format_phone(payment.phone) if payment.phone else "Non renseigné"
        ),
        "paid_at": payment.paid_at,
        "status": payment.status,
    }


def promise_dict(promise: PromiseToPay) -> dict:
    return {
        "id": promise.id,
        "amount": promise.amount,
        "promised_on": promise.promised_on,
        "note": promise.note,
        "status": promise.status,
        "created_at": promise.created_at,
    }


def invoice_summary_dict(invoice: Invoice) -> dict:
    last_sent = None
    for reminder in invoice.reminders:
        if reminder.sent_at and (
            last_sent is None or reminder.sent_at > last_sent.sent_at
        ):
            last_sent = reminder
    promise = active_promise(invoice)
    stage = invoice_stage(invoice)
    return {
        "id": invoice.id,
        "reference": invoice.reference,
        "label": invoice.label,
        "customer_name": invoice.customer.name,
        "customer_phone": invoice.customer.phone,
        "customer_phone_display": format_phone(invoice.customer.phone),
        "amount_due": invoice.amount_due,
        "amount_paid": invoice.amount_paid,
        "remaining": invoice.remaining,
        "issued_on": invoice.issued_on,
        "due_on": invoice.due_on,
        "days_late": days_late(invoice),
        "stage": stage,
        "stage_label": STAGE_LABELS[stage],
        "status": invoice.status,
        "last_contact_at": last_sent.sent_at if last_sent else None,
        "last_channel": last_sent.channel if last_sent else None,
        "promise_on": promise.promised_on if promise else None,
        "public_token": invoice.access_token,
    }


def invoice_detail_dict(invoice: Invoice) -> dict:
    data = invoice_summary_dict(invoice)
    reminders = sorted(
        invoice.reminders,
        key=lambda item: (
            item.sent_at or datetime.combine(item.scheduled_on, time.min),
            item.id,
        ),
        reverse=True,
    )
    data.update(
        {
            "customer": customer_dict(invoice.customer),
            "notes": invoice.notes,
            "reminders": [reminder_dict(item) for item in reminders],
            "payments": [
                payment_dict(item)
                for item in sorted(
                    invoice.payments, key=lambda item: item.paid_at, reverse=True
                )
            ],
            "promises": [
                promise_dict(item)
                for item in sorted(
                    invoice.promises,
                    key=lambda item: item.created_at,
                    reverse=True,
                )
            ],
            "can_pay": invoice.status == "open" and invoice.remaining > 0,
        }
    )
    return data


def public_invoice_dict(invoice: Invoice) -> dict:
    stage = invoice_stage(invoice)
    merchant = invoice.merchant
    return {
        "merchant_name": merchant.name,
        "merchant_phone_display": format_phone(merchant.phone),
        "merchant_quartier": merchant.quartier,
        "reference": invoice.reference,
        "label": invoice.label,
        "customer_name": invoice.customer.name,
        "amount_due": invoice.amount_due,
        "amount_paid": invoice.amount_paid,
        "remaining": invoice.remaining,
        "due_on": invoice.due_on,
        "days_late": days_late(invoice),
        "stage": stage,
        "stage_label": STAGE_LABELS[stage],
    }


def receipt_dict(payment: Payment, invoice: Invoice) -> dict:
    return {
        "receipt": payment.reference,
        "invoice_reference": invoice.reference,
        "merchant_name": invoice.merchant.name,
        "amount": payment.amount,
        "fee_amount": payment.fee_amount,
        "method": payment.method,
        "method_label": METHOD_LABELS.get(payment.method, payment.method),
        "paid_at": payment.paid_at,
        "remaining": invoice.remaining,
        "invoice_status": invoice.status,
    }
