from __future__ import annotations

from datetime import datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import (
    Answer,
    Appointment,
    Call,
    Closure,
    Contact,
    Dispatch,
    Line,
    MenuEntry,
    Message,
    Organization,
    Schedule,
    Service,
    User,
)
from ..utils import (
    JOURS_FR,
    format_clock,
    format_date_fr,
    format_day_fr,
    format_duration,
    format_phone,
    relative_time,
    utcnow,
)
from . import contacts as annuaire
from . import dispatch as envois
from . import calendar_cm as calendar
from . import gaps, hours, scheduling, switching

OUTCOME_LABELS = {
    "renseigne": "Renseigné",
    "rendezvous": "Rendez-vous pris",
    "message": "Message laissé",
    "transfert": "Transféré",
    "raccroche": "Sans suite",
    "hors_horaires": "Hors horaires",
    "sature": "Lignes saturées",
}
HANDLED_LABELS = {
    "voix": "Tenu par la voix",
    "humain": "Tenu par une personne",
    "messagerie": "Messagerie",
}
MESSAGE_LABELS = {"nouveau": "Nouveau", "en_cours": "En cours", "rappelle": "Rappelé"}
APPT_LABELS = {
    "confirme": "Confirmé",
    "annule": "Annulé",
    "manque": "Manqué",
    "venu": "Venu",
}
KIND_LABELS = {
    "universite": "Université",
    "ecole": "École",
    "clinique": "Clinique",
    "agence": "Agence",
}
CLOSURE_LABELS = {
    "ferie": "Jour férié",
    "pedagogique": "Journée pédagogique",
    "vacances": "Vacances",
    "evenement": "Événement de l'établissement",
    "autre": "Fermeture notée",
}
LANGUAGE_LABELS = {"fr": "Français", "en": "Anglais", "bilingue": "Deux langues"}
SCRIPT_MAX = 40
TOUCHE_TAILLE = 3


def org_dict(org: Organization) -> dict:
    return {
        "id": org.id,
        "name": org.name,
        "kind": org.kind,
        "kind_label": KIND_LABELS.get(org.kind, org.kind),
        "city": org.city,
        "quartier": org.quartier,
        "main_line": org.main_line,
        "main_line_display": org.main_line_display,
        "agent_name": org.agent_name,
        "greeting": org.greeting,
        "greeting_en": org.greeting_en,
        "language": org.language,
        "language_label": LANGUAGE_LABELS.get(org.language, org.language),
        "tone": org.tone,
        "callback_minutes": org.callback_minutes,
        "plan": org.plan,
        "monthly_fee": org.monthly_fee,
        "sms_price": org.sms_price,
        "discretion": org.discretion,
        "sms_enabled": org.sms_enabled,
        "whatsapp_enabled": org.whatsapp_enabled,
        "voice_enabled": org.voice_enabled,
        "auto_reminders": org.auto_reminders,
        "daily_log": org.daily_log,
    }


def user_dict(user: User) -> dict:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def session_dict(user: User) -> dict:
    return {
        "user": user_dict(user),
        "organization": org_dict(user.organization),
        "demo": settings.demo_mode,
    }


def schedule_dict(row: Schedule) -> dict:
    return {
        "id": row.id,
        "weekday": row.weekday,
        "label": JOURS_FR[row.weekday],
        "opens": row.opens.strftime("%H:%M"),
        "closes": row.closes.strftime("%H:%M"),
    }


def closure_dict(row: Closure) -> dict:
    return {
        "id": row.id,
        "starts": row.starts.isoformat(),
        "ends": row.ends.isoformat(),
        "reason": row.reason,
        "reason_en": row.reason_en,
        "kind": row.kind,
        "kind_label": CLOSURE_LABELS.get(row.kind, row.kind),
        "period": (
            format_date_fr(row.starts)
            if row.starts == row.ends
            else f"{format_date_fr(row.starts)} au {format_date_fr(row.ends)}"
        ),
        "days": (row.ends - row.starts).days + 1,
    }


def menu_dict(entry: MenuEntry) -> dict:
    return {
        "id": entry.id,
        "digit": entry.digit,
        "label": entry.label,
        "label_en": entry.label_en,
        "action": entry.action,
        "answer_id": entry.answer_id,
        "service_id": entry.service_id,
        "target_line_id": entry.target_line_id,
    }


def line_dict(line: Line, *, detail: bool = False) -> dict:
    data = {
        "id": line.id,
        "label": line.label,
        "number": line.number,
        "number_display": line.number_display,
        "position": line.position,
        "answered_by_human": line.answered_by_human,
        "capacity": line.capacity,
        "menu_size": len(line.menu),
    }
    if detail:
        data["schedules"] = [schedule_dict(s) for s in line.schedules]
        data["week"] = hours.semaine_type(line)
        data["menu"] = [menu_dict(m) for m in line.menu]
    return data


def answer_dict(answer: Answer) -> dict:
    return {
        "id": answer.id,
        "statement": answer.statement,
        "keywords": answer.keywords,
        "body": answer.body,
        "statement_en": answer.statement_en,
        "keywords_en": answer.keywords_en,
        "body_en": answer.body_en,
        "bilingual": bool(answer.body_en.strip()),
        "area": answer.area,
        "follow_up": answer.follow_up,
        "hits": answer.hits,
        "updated_at": answer.updated_at.isoformat(),
        "updated_label": relative_time(answer.updated_at),
        "seconde": round(len(answer.body.split()) / 2.6, 1),
    }


def service_dict(db: Session, service: Service, *, detail: bool = False) -> dict:
    data = {
        "id": service.id,
        "name": service.name,
        "room": service.room,
        "duration_min": service.duration_min,
        "step_min": service.step_min,
        "lead_days": service.lead_days,
        "horizon_days": service.horizon_days,
        "note": service.note,
        "days": [
            {
                "weekday": d.weekday,
                "label": JOURS_FR[d.weekday],
                "opens": d.opens.strftime("%H:%M"),
                "closes": d.closes.strftime("%H:%M"),
            }
            for d in service.days
        ],
    }
    if detail:
        data["calendar"] = scheduling.semaines(db, service)
        data["next"] = [
            p.isoformat() for p in scheduling.disponibilites(db, service, limit=6)
        ]
    return data


def appointment_dict(appointment: Appointment) -> dict:
    start = appointment.starts_at
    return {
        "id": appointment.id,
        "reference": appointment.reference,
        "caller_name": appointment.caller_name,
        "caller_phone": appointment.caller_phone,
        "caller_phone_display": format_phone(appointment.caller_phone),
        "service_id": appointment.service_id,
        "service_name": appointment.service.name if appointment.service else "",
        "room": appointment.service.room if appointment.service else "",
        "starts_at": start.isoformat(),
        "day": format_day_fr(start.date()),
        "clock": format_clock(start.time()),
        "duration_min": appointment.duration_min,
        "language": appointment.language,
        "origin": appointment.origin,
        "status": appointment.status,
        "status_label": APPT_LABELS.get(appointment.status, appointment.status),
        "note": appointment.note,
        "reminded": appointment.reminded_at is not None,
    }


def call_dict(call: Call) -> dict:
    lignes = [l for l in call.transcript.split("\n") if l.strip()]
    return {
        "id": call.id,
        "line_id": call.line_id,
        "line_label": call.line.label if call.line else "Poste supprimé",
        "caller_phone": call.caller_phone,
        "caller_phone_display": format_phone(call.caller_phone) or "Numéro masqué",
        "caller_name": call.caller_name,
        "started_at": call.started_at.isoformat(),
        "day": format_day_fr(call.started_at.date()),
        "clock": format_clock(call.started_at.time()),
        "ago": relative_time(call.started_at),
        "duration_sec": call.duration_sec,
        "duration_label": format_duration(call.duration_sec),
        "language": call.language,
        "question": call.question,
        "handled": call.handled,
        "handled_label": HANDLED_LABELS.get(call.handled, call.handled),
        "outcome": call.outcome,
        "outcome_label": OUTCOME_LABELS.get(call.outcome, call.outcome),
        "digit": call.digit,
        "answer_id": call.answer_id,
        "appointment_id": call.appointment_id,
        "script": lignes[:SCRIPT_MAX],
    }


def message_dict(message: Message) -> dict:
    return {
        "id": message.id,
        "line_id": message.line_id,
        "line_label": message.line.label if message.line else "Standard",
        "from_name": message.from_name,
        "from_phone": message.from_phone,
        "from_phone_display": format_phone(message.from_phone),
        "body": message.body,
        "urgency": message.urgency,
        "language": message.language,
        "promised_at": message.promised_at.isoformat(),
        "promised_label": promesse_dict(message),
        "status": message.status,
        "status_label": MESSAGE_LABELS.get(message.status, message.status),
        "handled_by": message.handled_by,
        "handled_note": message.handled_note,
        "recalled_at": message.recalled_at.isoformat() if message.recalled_at else None,
        "created_at": message.created_at.isoformat(),
        "created_label": relative_time(message.created_at),
        "overdue": message.overdue,
    }


def promesse_dict(message: Message) -> str:
    jour = (
        "aujourd'hui"
        if message.promised_at.date() == utcnow().date()
        else format_day_fr(message.promised_at.date())
    )
    return f"{jour} avant {format_clock(message.promised_at.time())}"


def contact_dict(contact: Contact) -> dict:
    return {
        "id": contact.id,
        "phone": contact.phone,
        "phone_display": contact.phone_display,
        "name": contact.name,
        "tag": contact.tag,
        "tag_label": annuaire.TAG_LABELS.get(contact.tag, contact.tag),
        "note": contact.note,
        "salutation": contact.salutation,
        "call_count": contact.call_count,
        "first_seen": contact.first_seen.isoformat(),
        "last_seen": contact.last_seen.isoformat(),
        "last_label": relative_time(contact.last_seen),
    }


def dispatch_dict(envoi: Dispatch) -> dict:
    return {
        "id": envoi.id,
        "channel": envoi.channel,
        "channel_label": envois.CHANNEL_LABELS.get(envoi.channel, envoi.channel),
        "to_phone": envoi.to_phone,
        "to_phone_display": format_phone(envoi.to_phone),
        "subject": envoi.subject,
        "body": envoi.body,
        "status": envoi.status,
        "reference": envoi.reference,
        "segments": envoi.segments,
        "cost": envoi.cost,
        "language": envoi.language,
        "planned_at": envoi.planned_at.isoformat(),
        "sent_at": envoi.sent_at.isoformat() if envoi.sent_at else None,
        "ago": relative_time(envoi.sent_at or envoi.planned_at),
    }


def etat_lignes(db: Session, org: Organization, moment: datetime) -> list[dict]:
    """La plaque de la console : qui décroche, qui attend, sur quel numéro."""
    closures = hours.jours_fermes(db, org.id)
    etats = []
    for line in org.lines:
        ouverte = hours.est_ouverte(line, moment, closures)
        suite = hours.prochaine_ouverture(line, moment, closures)
        prises = switching.occupation(db, line, moment) if ouverte else 0
        etats.append(
            {
                "id": line.id,
                "label": line.label,
                "number_display": line.number_display,
                "open": ouverte,
                "human": line.answered_by_human,
                "today": hours.resume_journee(line, moment.date(), closures),
                "capacity": line.capacity,
                "prises": prises,
                "saturated": bool(line.capacity) and prises >= line.capacity,
                "next": suite.isoformat() if suite else None,
                "next_label": prochaine_en_mots(suite),
            }
        )
    return etats


def prochaine_en_mots(suite: datetime | None) -> str:
    if not suite:
        return "aucun horaire réglé"
    jour = (
        "aujourd'hui"
        if suite.date() == utcnow().date()
        else format_day_fr(suite.date())
    )
    return f"{jour} à {format_clock(suite.time())}"


def _compte_journee(
    db: Session, org_id: int, debut: datetime, fin: datetime
) -> tuple[int, int]:
    total = db.scalar(
        select(func.count(Call.id)).where(
            Call.organization_id == org_id,
            Call.started_at >= debut,
            Call.started_at < fin,
        )
    )
    par_voix = db.scalar(
        select(func.count(Call.id)).where(
            Call.organization_id == org_id,
            Call.started_at >= debut,
            Call.started_at < fin,
            Call.handled == "voix",
        )
    )
    return total or 0, par_voix or 0


def minutes_evitees(appels_par_la_voix: int) -> int:
    """Ce que l'établissement n'a pas eu à tenir, à trois minutes par appel."""
    return appels_par_la_voix * 3


def semaine_appels(db: Session, org_id: int, maintenant: datetime) -> list[dict]:
    """Sept jours de standard, pour comparer la semaine qui passe à la suivante."""
    barres = []
    for pas in range(6, -1, -1):
        jour = maintenant.date() - timedelta(days=pas)
        debut = datetime.combine(jour, time.min)
        total, par_voix = _compte_journee(db, org_id, debut, debut + timedelta(days=1))
        barres.append(
            {
                "day": jour.isoformat(),
                "label": JOURS_FR[jour.weekday()][:3],
                "total": total,
                "voice": par_voix,
            }
        )
    return barres


def heure_de_pointe(db: Session, org_id: int, depuis: datetime) -> dict:
    """L'heure que tout le monde appelle, sur les sept derniers jours."""
    fiches = db.scalars(
        select(Call).where(
            Call.organization_id == org_id, Call.started_at >= depuis
        )
    ).all()
    horloges: dict[int, int] = {}
    touches: dict[str, int] = {}
    for fiche in fiches:
        horloges[fiche.started_at.hour] = horloges.get(fiche.started_at.hour, 0) + 1
        if fiche.digit:
            touches[fiche.digit] = touches.get(fiche.digit, 0) + 1
    pire = (
        max(horloges.items(), key=lambda item: (item[1], -item[0]))
        if horloges
        else None
    )
    tete = sorted(touches.items(), key=lambda item: -item[1])[:TOUCHE_TAILLE]
    return {
        "hour": f"{pire[0]:02d} h" if pire else "",
        "calls": pire[1] if pire else 0,
        "touches": [{"digit": digit, "count": n} for digit, n in tete],
    }


def charge_anglaise(db: Session, org_id: int, depuis: datetime) -> int:
    return (
        db.scalar(
            select(func.count(Call.id)).where(
                Call.organization_id == org_id,
                Call.started_at >= depuis,
                Call.language == "en",
            )
        )
        or 0
    )


def tableau_bord(db: Session, org: Organization) -> dict:
    """Ce que l'établissement regarde le matin : la veille, le jour qui commence."""
    maintenant = utcnow()
    debut_jour = datetime.combine(maintenant.date(), time.min)
    hier = debut_jour - timedelta(days=1)
    total, par_voix = _compte_journee(db, org.id, debut_jour, maintenant)
    total_hier, voix_hier = _compte_journee(db, org.id, hier, debut_jour)
    en_attente = db.scalar(
        select(func.count(Message.id)).where(
            Message.organization_id == org.id, Message.status != "rappelle"
        )
    )
    oubliees = db.scalar(
        select(func.count(Message.id)).where(
            Message.organization_id == org.id,
            Message.status != "rappelle",
            Message.promised_at < maintenant,
        )
    )
    prochains = db.scalars(
        select(Appointment)
        .where(
            Appointment.organization_id == org.id,
            Appointment.status == "confirme",
            Appointment.starts_at >= maintenant,
        )
        .order_by(Appointment.starts_at)
        .limit(5)
    ).all()
    fiches = db.scalars(
        select(Call)
        .where(Call.organization_id == org.id)
        .order_by(Call.started_at.desc())
        .limit(8)
    ).all()
    tetes = db.scalars(
        select(Answer)
        .where(Answer.organization_id == org.id)
        .order_by(Answer.hits.desc())
        .limit(4)
    ).all()
    return {
        "day": format_day_fr(maintenant.date()),
        "calls_today": total,
        "calls_by_voice": par_voix,
        "share_voice": round(100 * par_voix / total) if total else 0,
        "calls_yesterday": total_hier,
        "voice_yesterday": voix_hier,
        "minutes_saved": minutes_evitees(par_voix),
        "waiting_messages": en_attente or 0,
        "overdue_messages": oubliees or 0,
        "upcoming": [appointment_dict(a) for a in prochains],
        "recent_calls": [call_dict(c) for c in fiches],
        "top_answers": [
            {"id": a.id, "statement": a.statement, "hits": a.hits, "area": a.area}
            for a in tetes
        ],
        "lines": etat_lignes(db, org, maintenant),
        "week": semaine_appels(db, org.id, maintenant),
        "closures": [closure_dict(c) for c in hours.jours_fermes(db, org.id)],
        **charge_semaine(db, org, maintenant),
    }


def charge_semaine(db: Session, org: Organization, maintenant: datetime) -> dict:
    """Ce que la semaine a coûté, saturé, et ce que le répertoire ignore encore."""
    depuis = maintenant - timedelta(days=7)
    total = db.scalar(
        select(func.count(Call.id)).where(
            Call.organization_id == org.id, Call.started_at >= depuis
        )
    ) or 0
    saturations = db.scalar(
        select(func.count(Call.id)).where(
            Call.organization_id == org.id,
            Call.started_at >= depuis,
            Call.outcome == "sature",
        )
    ) or 0
    inconnues = db.scalar(
        select(func.count(Call.id)).where(
            Call.organization_id == org.id,
            Call.started_at >= depuis,
            Call.answer_id.is_(None),
            Call.question != "",
        )
    ) or 0
    return {
        "week_calls": total,
        "week_saturations": saturations,
        "week_sms_cost": envois.occupation(db, org.id, depuis),
        "week_english": charge_anglaise(db, org.id, depuis),
        "rush": heure_de_pointe(db, org.id, depuis),
        "holes": len(gaps.trous(db, org)),
        "known_numbers": db.scalar(
            select(func.count(Contact.id)).where(Contact.organization_id == org.id)
        ) or 0,
        "next_holiday": calendar.prochain_jour_chome(
            maintenant.date(),
            deja=set(
                db.scalars(
                    select(Closure.starts).where(Closure.organization_id == org.id)
                ).all()
            ),
        ),
    }
