from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..config import settings
from ..models import Invoice, Merchant, Reminder
from ..utils import days_late, format_date_fr, format_fcfa, format_phone, utcnow

CHANNEL_LABELS = {
    "sms": "SMS",
    "whatsapp": "WhatsApp",
    "voice": "Vocal",
}


@dataclass(frozen=True)
class ReminderStep:
    code: str
    label: str
    offset: int
    channel: str
    description: str


STEPS: tuple[ReminderStep, ...] = (
    ReminderStep(
        "pre_echeance",
        "J-3 · SMS",
        -3,
        "sms",
        "Un rappel léger avant la date d'échéance.",
    ),
    ReminderStep(
        "jour_echeance",
        "J0 · WhatsApp",
        0,
        "whatsapp",
        "Le lien de paiement arrive le jour même.",
    ),
    ReminderStep(
        "retard_3",
        "J+3 · WhatsApp",
        3,
        "whatsapp",
        "Une question simple : y a-t-il un contretemps ?",
    ),
    ReminderStep(
        "retard_7",
        "J+7 · SMS",
        7,
        "sms",
        "Le solde et le lien, sans détour.",
    ),
    ReminderStep(
        "retard_14",
        "J+14 · Vocal",
        14,
        "voice",
        "Un appel lu par une voix locale, jamais agressive.",
    ),
)

STEPS_BY_CODE = {step.code: step for step in STEPS}

STAGE_LABELS = {
    "upcoming": "À échoir",
    "late": "En retard",
    "partial": "Partielle",
    "promise": "Promesse",
    "paid": "Réglée",
    "disputed": "Litige",
}


def channel_enabled(merchant: Merchant, channel: str) -> bool:
    return bool(
        {
            "sms": merchant.sms_enabled,
            "whatsapp": merchant.whatsapp_enabled,
            "voice": merchant.voice_enabled,
        }.get(channel, False)
    )


def choose_channel(merchant: Merchant, preferred: str) -> str | None:
    for channel in (preferred, "whatsapp", "sms", "voice"):
        if channel_enabled(merchant, channel):
            return channel
    return None


def public_pay_url(invoice: Invoice) -> str:
    base = settings.public_base_url.rstrip("/")
    return f"{base}/payer/{invoice.access_token}"


def step_label(code: str) -> str:
    if code.startswith("manuel-"):
        return "Relance manuelle"
    step = STEPS_BY_CODE.get(code)
    return step.label if step else "Relance"


def build_message(invoice: Invoice, step: ReminderStep, tone: str) -> str:
    customer = invoice.customer
    merchant = invoice.merchant
    amount = format_fcfa(invoice.remaining)
    due = format_date_fr(invoice.due_on)
    late = days_late(invoice)
    link = public_pay_url(invoice)
    reference = invoice.reference
    signature = (
        f"\n\n{merchant.name}\nService des comptes, "
        f"{merchant.quartier or merchant.city}"
    )

    if step.code == "pre_echeance":
        if tone == "ferme":
            return (
                f"Rappel : la facture {reference} de {amount} arrive à échéance "
                f"le {due}. Merci de prévoir le règlement.{signature}"
            )
        return (
            f"Bonjour {customer.name}, un rappel avant échéance : la facture "
            f"{reference} de {amount} arrive à échéance le {due}. Si c'est déjà "
            f"réglé, ignorez ce message.{signature}"
        )

    if step.code == "jour_echeance":
        if tone == "ferme":
            return (
                f"La facture {reference} ({amount}) est due aujourd'hui. "
                f"Réglez par MoMo : {link}{signature}"
            )
        return (
            f"Bonjour {customer.name}, la facture {reference} de {amount} est "
            f"due aujourd'hui. Le règlement prend 30 secondes par MTN MoMo ou "
            f"Orange Money : {link}{signature}"
        )

    if step.code == "retard_3":
        if tone == "ferme":
            return (
                f"La facture {reference} ({amount}) est échue depuis {late} jours. "
                f"Merci de régler ou de nous donner une date avant demain."
                f"{signature}"
            )
        return (
            f"Bonjour {customer.name}, nous n'avons pas encore reçu le règlement "
            f"de la facture {reference} ({amount}). Un contretemps ? Répondez à ce "
            f"message, on trouve une date ensemble.{signature}"
        )

    if step.code == "retard_7":
        if tone == "ferme":
            return (
                f"Facture {reference} : {amount} impayés, {late} jours de retard. "
                f"Réglez maintenant : {link}\n\nRépondez STOP pour arrêter les SMS."
                f"{signature}"
            )
        return (
            f"Bonjour {customer.name}, il reste {amount} sur la facture "
            f"{reference}, en retard de {late} jours. Le lien ci-dessous clôt le "
            f"dossier en 30 secondes : {link}\n\nRépondez STOP pour arrêter les SMS."
            f"{signature}"
        )

    merchant_phone = format_phone(merchant.phone)
    if tone == "ferme":
        # Le ton ferme reste amiable : on ne menace pas, on date la prochaine étape.
        return (
            f"Bonjour, ici le service des comptes de {merchant.name}. La facture "
            f"{reference} de {customer.name} présente un solde de {amount}, en "
            f"retard de {late} jours. Il s'agit de notre dernier rappel amiable. "
            f"Merci de rappeler le {merchant_phone} pour convenir d'un règlement."
        )
    return (
        f"Bonjour, ici le service des comptes de {merchant.name}. Nous appelons au "
        f"sujet de la facture {reference} de {customer.name}, dont le solde est de "
        f"{amount}, en retard de {late} jours. Pour trouver une solution simplement, "
        f"rappelez le {merchant_phone}. Merci."
    )


def message_for_code(invoice: Invoice, code: str, tone: str) -> str:
    step = STEPS_BY_CODE.get(code)
    if not step:
        step = STEPS_BY_CODE["retard_7"]
    return build_message(invoice, step, tone)


def sync_invoice_reminders(
    db: Session, invoice: Invoice, regenerate_bodies: bool = False
) -> None:
    merchant = invoice.merchant
    if invoice.status in {"paid", "disputed"}:
        for reminder in invoice.reminders:
            if reminder.status == "planned":
                reminder.status = "cancelled"
        return

    for step in STEPS:
        existing = next(
            (
                reminder
                for reminder in invoice.reminders
                if reminder.step_code == step.code
                and reminder.status in {"planned", "cancelled", "sent", "skipped"}
            ),
            None,
        )
        if existing and existing.status in {"sent", "skipped"}:
            continue

        channel = choose_channel(merchant, step.channel)
        if not channel or not merchant.auto_reminders:
            if existing and existing.status in {"planned", "cancelled"}:
                existing.status = "cancelled"
            continue

        scheduled_on = invoice.due_on + timedelta(days=step.offset)
        if existing is None:
            body = build_message(invoice, step, merchant.tone)
            invoice.reminders.append(
                Reminder(
                    channel=channel,
                    step_code=step.code,
                    body=body,
                    tone=merchant.tone,
                    scheduled_on=scheduled_on,
                    status="planned",
                )
            )
            continue

        existing.channel = channel
        existing.scheduled_on = scheduled_on
        existing.tone = merchant.tone
        existing.status = "planned"
        if regenerate_bodies or existing.status == "planned":
            existing.body = build_message(invoice, step, merchant.tone)


def refresh_planned_bodies(invoice: Invoice) -> None:
    merchant = invoice.merchant
    for reminder in invoice.reminders:
        if reminder.status != "planned":
            continue
        step = STEPS_BY_CODE.get(reminder.step_code)
        if step:
            reminder.body = build_message(invoice, step, merchant.tone)
            reminder.tone = merchant.tone


def cancel_planned_reminders(invoice: Invoice) -> None:
    for reminder in invoice.reminders:
        if reminder.status == "planned":
            reminder.status = "cancelled"


def sync_merchant_reminders(db: Session, merchant: Merchant) -> None:
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.merchant_id == merchant.id)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.reminders),
            selectinload(Invoice.promises),
        )
    ).all()
    for invoice in invoices:
        invoice.merchant = merchant
        sync_invoice_reminders(db, invoice)


def run_due_reminders(
    db: Session, merchant: Merchant, dry_run: bool = False
) -> dict:
    invoices = db.scalars(
        select(Invoice)
        .where(Invoice.merchant_id == merchant.id)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.reminders),
            selectinload(Invoice.promises),
            selectinload(Invoice.merchant),
        )
    ).all()

    for invoice in invoices:
        sync_invoice_reminders(db, invoice)
    db.flush()

    today = date.today()
    sent = 0
    skipped = 0
    by_channel: dict[str, int] = {}
    items: list[dict] = []

    for invoice in invoices:
        if invoice.status != "open" or invoice.customer.opt_out:
            continue
        candidates = [
            reminder
            for reminder in invoice.reminders
            if reminder.status == "planned"
            and reminder.scheduled_on <= today
            and channel_enabled(merchant, reminder.channel)
        ]
        if not candidates:
            continue

        candidates.sort(
            key=lambda reminder: (
                reminder.scheduled_on,
                STEPS_BY_CODE.get(reminder.step_code, STEPS[-1]).offset,
            )
        )
        keep = candidates[-1]
        older = candidates[:-1]
        skipped += len(older)
        if not dry_run:
            for reminder in older:
                reminder.status = "skipped"

            step = STEPS_BY_CODE.get(keep.step_code)
            keep.body = (
                build_message(invoice, step, merchant.tone)
                if step
                else keep.body
            )
            keep.tone = merchant.tone
            keep.status = "sent"
            keep.sent_at = utcnow()
            keep.provider_ref = f"DEMO-{uuid4().hex[:8].upper()}"

        sent += 1
        by_channel[keep.channel] = by_channel.get(keep.channel, 0) + 1
        items.append(
            {
                "invoice_reference": invoice.reference,
                "customer_name": invoice.customer.name,
                "channel": keep.channel,
                "channel_label": CHANNEL_LABELS[keep.channel],
                "body": keep.body,
                "scheduled_on": keep.scheduled_on,
            }
        )

    for invoice in invoices:
        for promise in invoice.promises:
            if promise.status == "active" and promise.promised_on < today:
                promise.status = "broken"

    if dry_run:
        db.rollback()
    else:
        db.commit()

    return {
        "dry_run": dry_run,
        "sent": sent,
        "skipped": skipped,
        "by_channel": by_channel,
        "items": items,
    }


def send_direct_reminder(db: Session, invoice: Invoice) -> dict:
    if invoice.status != "open":
        raise ValueError("Cette créance ne peut plus être relancée.")
    if invoice.customer.opt_out:
        raise ValueError("Ce client est désinscrit des relances.")

    late = days_late(invoice)
    if late >= 14:
        target_code = "retard_14"
    elif late >= 7:
        target_code = "retard_7"
    elif late >= 1:
        target_code = "retard_3"
    elif late == 0:
        target_code = "jour_echeance"
    else:
        target_code = "pre_echeance"

    planned = sorted(
        (r for r in invoice.reminders if r.status == "planned"),
        key=lambda reminder: reminder.scheduled_on,
    )
    reminder = next(
        (r for r in planned if r.step_code == target_code), None
    )
    step = STEPS_BY_CODE[target_code]

    if reminder is None:
        reminder = Reminder(
            invoice_id=invoice.id,
            channel=choose_channel(invoice.merchant, step.channel) or "sms",
            step_code=f"manuel-{uuid4().hex[:6]}",
            body=build_message(invoice, step, invoice.merchant.tone),
            tone=invoice.merchant.tone,
            scheduled_on=date.today(),
            status="planned",
        )
        db.add(reminder)
        invoice.reminders.append(reminder)

    reminder.body = build_message(invoice, step, invoice.merchant.tone)
    reminder.tone = invoice.merchant.tone
    reminder.channel = (
        reminder.channel
        if channel_enabled(invoice.merchant, reminder.channel)
        else (choose_channel(invoice.merchant, step.channel) or "sms")
    )
    reminder.status = "sent"
    reminder.sent_at = utcnow()
    reminder.provider_ref = f"DEMO-{uuid4().hex[:8].upper()}"
    db.commit()
    return reminder


def next_reference(db: Session, merchant: Merchant, reserved: int = 0) -> str:
    year = date.today().year
    references = db.scalars(
        select(Invoice.reference).where(Invoice.merchant_id == merchant.id)
    ).all()
    sequences = []
    for reference in references:
        try:
            sequences.append(int(reference.rsplit("-", 1)[-1]))
        except ValueError:
            continue
    sequence = max(sequences, default=0) + 1 + reserved
    return f"PAL-{year}-{sequence:04d}"


def new_access_token() -> str:
    return secrets.token_urlsafe(18)


def sequence_for(merchant: Merchant) -> list[dict]:
    return [
        {
            "code": step.code,
            "label": step.label,
            "offset": step.offset,
            "channel": step.channel,
            "channel_label": CHANNEL_LABELS[step.channel],
            "enabled": bool(merchant.auto_reminders)
            and channel_enabled(merchant, step.channel),
            "description": step.description,
        }
        for step in STEPS
    ]
