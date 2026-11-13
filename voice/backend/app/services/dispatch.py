from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Appointment, Dispatch, Message, Organization
from ..utils import (
    format_clock,
    format_clock_en,
    format_day_en,
    format_day_fr,
    format_phone,
    utcnow,
)

CHANNEL_LABELS = {"sms": "SMS", "whatsapp": "WhatsApp", "appel_vocal": "appel vocal"}
LIMITE_SMS = 480
PRENOM_TAILLE = 22
GSM7 = (
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?"
    "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"
    "^{}\\[~]|€"
)
SEPARATE_GSM7 = 160
SEPARATE_UNICODE = 70


def langue(org: Organization, code: str | None = None) -> str:
    """Ni l'anglais ni le français par défaut : la langue choisie par l'appelant."""
    if code in ("fr", "en"):
        return code
    if org.language == "en":
        return "en"
    return "fr"


def alphabet(texte: str) -> str:
    return "gsm7" if all(chaine in GSM7 for chaine in texte) else "unicode"


def segments(texte: str) -> int:
    """Combien de fois le texte passe à la caisse de l'opérateur."""
    taille = SEPARATE_GSM7 if alphabet(texte) == "gsm7" else SEPARATE_UNICODE
    return max(1, -(-len(texte) // taille))


def cout(org: Organization, channel: str, texte: str) -> int:
    if channel != "sms":
        return 0
    return segments(texte) * max(0, org.sms_price)


def actif(org: Organization, channel: str) -> bool:
    if channel == "sms":
        return org.sms_enabled
    if channel == "whatsapp":
        return org.whatsapp_enabled
    return org.voice_enabled


def jeton() -> str:
    """Une référence d'envoi. En démo, elle commence par DEM pour qu'on la voie."""
    return f"DEM-{secrets.token_hex(3).upper()}"


def envoyer(
    db: Session,
    org: Organization,
    *,
    channel: str,
    to_phone: str,
    body: str,
    subject: str = "",
    planned_at: datetime | None = None,
    code: str = "fr",
) -> Dispatch:
    """La trace de ce qui part vers un téléphone, sans jamais appeler d'opérateur."""
    texte = body.strip()
    statut = "envoye"
    if not actif(org, channel):
        statut = "echoue"
        coupure = (
            "(This channel is switched off in the establishment settings.)"
            if code == "en"
            else "(Canal coupé dans les réglages de l'établissement.)"
        )
        texte = f"{texte}\n{coupure}"
    texte = texte[:LIMITE_SMS]
    envoi = Dispatch(
        organization_id=org.id,
        channel=channel,
        to_phone=to_phone,
        subject=subject,
        body=texte,
        status=statut,
        reference=jeton(),
        segments=segments(texte),
        cost=cout(org, channel, texte),
        language=code,
        planned_at=planned_at or utcnow(),
        sent_at=utcnow() if statut == "envoye" and not planned_at else None,
    )
    db.add(envoi)
    db.flush()
    return envoi


def _horloge(moment: datetime, code: str) -> str:
    if code == "en":
        return format_clock_en(moment.time())
    return format_clock(moment.time())


def _jour(moment: datetime, code: str) -> str:
    jour = moment.date()
    return format_day_en(jour) if code == "en" else format_day_fr(jour)


def confirmer_rdv(
    db: Session, org: Organization, appointment: Appointment, code: str = "fr"
) -> Dispatch | None:
    """Le SMS ou le WhatsApp qui suit la pose d'un rendez-vous."""
    canal = "sms" if org.sms_enabled else "whatsapp" if org.whatsapp_enabled else None
    if canal is None:
        return None
    code = langue(org, code)
    jour = _jour(appointment.starts_at, code)
    heure = _horloge(appointment.starts_at, code)
    if code == "en":
        corps = (
            f"{org.name}: your slot for {appointment.service.name} is booked "
            f"for {jour} at {heure}. Reference {appointment.reference}. "
            f"Call {org.main_line_display} to change the time."
        )
    else:
        corps = (
            f"{org.name} : votre place pour {appointment.service.name} est notée "
            f"{jour} à {heure}. Référence {appointment.reference}. "
            f"Appel au {org.main_line_display} pour changer d'heure."
        )
    return envoyer(
        db, org, channel=canal, to_phone=appointment.caller_phone, body=corps, code=code
    )


def rappeler_rdv(
    db: Session, org: Organization, appointment: Appointment, code: str = "fr"
) -> Dispatch:
    """Le rappel de la veille : court, nominatif, sans menace."""
    if org.whatsapp_enabled:
        canal = "whatsapp"
    elif org.sms_enabled:
        canal = "sms"
    else:
        canal = "appel_vocal"
    code = langue(org, code)
    parties = appointment.caller_name.split()
    prenom = parties[0][:PRENOM_TAILLE] if parties else ""
    jour = _jour(appointment.starts_at, code)
    heure = _horloge(appointment.starts_at, code)
    if code == "en":
        debut = f"Hello {prenom}, " if prenom else "Hello, "
        corps = (
            f"{debut}this is {org.agent_name} from {org.name}. "
            f"We are expecting you {jour} at {heure} for {appointment.service.name}, "
            f"reference {appointment.reference}."
        )
    else:
        debut = f"Bonjour {prenom}, " if prenom else "Bonjour, "
        corps = (
            f"{debut}ici {org.agent_name} de {org.name}. "
            f"On vous attend {jour} à {heure} pour {appointment.service.name}, "
            f"référence {appointment.reference}."
        )
    return envoyer(
        db, org, channel=canal, to_phone=appointment.caller_phone, body=corps, code=code
    )


def accuser_message(
    db: Session, org: Organization, message: Message, code: str = "fr"
) -> Dispatch | None:
    """À l'appelant qu'on a prévenu qu'un conseiller le reprendrait."""
    canal = "sms" if org.sms_enabled else "whatsapp" if org.whatsapp_enabled else None
    if canal is None:
        return None
    code = langue(org, code)
    jour = _jour(message.promised_at, code)
    heure = _horloge(message.promised_at, code)
    if code == "en":
        corps = (
            f"{org.name}: your message is on record. An officer will call you back "
            f"{jour} before {heure}. Keep {format_phone(message.from_phone)} open."
        )
    else:
        corps = (
            f"{org.name} : votre message est enregistré. Un conseiller vous rappelle "
            f"{jour} avant {heure}. Gardez le "
            f"{format_phone(message.from_phone)} ouvert."
        )
    return envoyer(
        db, org, channel=canal, to_phone=message.from_phone, body=corps, code=code
    )


def occupation(db: Session, org_id: int, depuis: datetime) -> int:
    """Ce que la semaine a déjà coûté en SMS, à la ligne près."""
    lignes = db.scalars(
        select(Dispatch).where(
            Dispatch.organization_id == org_id, Dispatch.planned_at >= depuis
        )
    ).all()
    return sum(ligne.cost for ligne in lignes)


def balayage(db: Session) -> int:
    """Ce qui était programmé et dont l'heure est passée part vraiment."""
    pendants = db.scalars(
        select(Dispatch)
        .where(Dispatch.status == "programme", Dispatch.planned_at <= utcnow())
        .order_by(Dispatch.planned_at)
    ).all()
    for envoi in pendants:
        envoi.status = "envoye"
        envoi.sent_at = utcnow()
    return len(pendants)


def relances_a_faire(db: Session, org: Organization, horizon_heures: int = 26) -> int:
    """Les rappels de la veille, posés dans la main courante au coup de 17 h."""
    if not org.auto_reminders:
        return 0
    maintenant = utcnow()
    borne = maintenant + timedelta(hours=horizon_heures)
    rendez_vous = db.scalars(
        select(Appointment)
        .where(
            Appointment.organization_id == org.id,
            Appointment.status == "confirme",
            Appointment.reminded_at.is_(None),
            Appointment.starts_at > maintenant,
            Appointment.starts_at <= borne,
        )
        .order_by(Appointment.starts_at)
    ).all()
    for appointment in rendez_vous:
        rappeler_rdv(db, org, appointment, code=appointment.language or "fr")
        appointment.reminded_at = maintenant
    return len(rendez_vous)
