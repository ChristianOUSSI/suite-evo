from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from ..config import settings
from ..deps import CurrentUser, DbSession
from ..models import Answer, Appointment, Call, Message, User
from ..schemas import SettingsIn, TeammateIn
from ..security import hash_password
from ..services import switching
from ..services.present import line_dict, org_dict, user_dict
from ..utils import utcnow

router = APIRouter(tags=["réglages"])


@router.get("/settings")
def lire(user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    compte = {
        "calls": db.scalar(
            select(func.count(Call.id)).where(Call.organization_id == org.id)
        )
        or 0,
        "answers": db.scalar(
            select(func.count(Answer.id)).where(Answer.organization_id == org.id)
        )
        or 0,
        "messages": db.scalar(
            select(func.count(Message.id)).where(Message.organization_id == org.id)
        )
        or 0,
        "appointments": db.scalar(
            select(func.count(Appointment.id)).where(
                Appointment.organization_id == org.id
            )
        )
        or 0,
    }
    return {
        "organization": org_dict(org),
        "team": [user_dict(membre) for membre in org.users],
        "lines": [line_dict(ligne, detail=True) for ligne in org.lines],
        "counters": compte,
        "demo": settings.demo_mode,
        "currency": "FCFA",
    }


@router.put("/settings")
def ecrire(payload: SettingsIn, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    org.name = payload.name
    org.kind = payload.kind
    org.city = payload.city
    org.quartier = payload.quartier
    org.main_line = payload.main_line or org.main_line
    org.agent_name = payload.agent_name
    org.greeting = payload.greeting
    org.greeting_en = payload.greeting_en
    org.language = payload.language
    org.tone = payload.tone
    org.callback_minutes = payload.callback_minutes
    org.sms_price = payload.sms_price
    org.discretion = payload.discretion
    org.sms_enabled = payload.sms_enabled
    org.whatsapp_enabled = payload.whatsapp_enabled
    org.voice_enabled = payload.voice_enabled
    org.auto_reminders = payload.auto_reminders
    org.daily_log = payload.daily_log
    db.commit()
    return org_dict(org)


@router.post("/settings/preview")
def apercu(user: CurrentUser, db: DbSession) -> dict:
    """La salutation telle qu'elle part, sur le premier poste, à l'heure d'ouverture."""
    org = user.organization
    moment = utcnow()
    lignes = org.lines
    if not lignes:
        return {"first": "", "others": [], "english": ""}
    entete = switching.salutation(org, lignes[0], moment, True, "fr")
    suite = [
        switching.salutation(org, ligne, moment, True, "fr") for ligne in lignes[1:]
    ]
    anglais = switching.salutation(org, lignes[0], moment, True, "en")
    return {
        "first": entete,
        "others": suite,
        "english": anglais,
        "line": lignes[0].label,
        "bilingual": org.language == "bilingue",
    }


@router.get("/team")
def equipe(user: CurrentUser, db: DbSession) -> list[dict]:
    org = user.organization
    return [user_dict(membre) for membre in org.users]


@router.post("/team")
def ajouter_membre(payload: TeammateIn, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    email = payload.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(status_code=422, detail="Cet email a déjà un compte.")
    membre = User(
        organization_id=org.id,
        name=payload.name,
        email=email,
        password_hash=hash_password(payload.password or "Voix2026!"),
        role=payload.role,
    )
    db.add(membre)
    db.commit()
    return user_dict(membre)
