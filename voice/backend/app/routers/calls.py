from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import or_, select

from ..deps import CurrentUser, DbSession
from ..models import Call, Line
from ..schemas import CallIn, SimulateIn
from ..services import contacts as annuaire
from ..services import dispatch as envois
from ..services import switching
from ..services.present import OUTCOME_LABELS, call_dict
from ..utils import normalize_phone, utcnow

router = APIRouter(tags=["journal d'appels"])

DEFAUT_JOURS = 14
MAX_LIGNES = 120


def _ligne(db: DbSession, org_id: int, line_id: int | None) -> Line | None:
    if line_id is None:
        return None
    ligne = db.get(Line, line_id)
    if not ligne or ligne.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Ce poste n'existe pas ici.")
    return ligne


@router.get("/calls")
def journal(
    user: CurrentUser,
    db: DbSession,
    line_id: int | None = Query(default=None),
    outcome: str | None = Query(default=None),
    jours: int = Query(default=DEFAUT_JOURS, ge=1, le=90),
    q: str = Query(default="", max_length=60),
    langue: str | None = Query(default=None, pattern="^(fr|en)$"),
) -> dict:
    org = user.organization
    depuis = utcnow() - timedelta(days=jours)
    clauses = [Call.organization_id == org.id, Call.started_at >= depuis]
    if line_id:
        clauses.append(Call.line_id == line_id)
    if outcome and outcome in OUTCOME_LABELS:
        clauses.append(Call.outcome == outcome)
    if langue:
        clauses.append(Call.language == langue)
    if q.strip():
        filtre = f"%{q.strip()}%"
        clauses.append(
            or_(Call.caller_name.ilike(filtre), Call.caller_phone.ilike(filtre))
        )
    fiches = db.scalars(
        select(Call).where(*clauses).order_by(Call.started_at.desc()).limit(MAX_LIGNES)
    ).all()
    appels = [call_dict(c) for c in fiches]
    repartition = {code: 0 for code in OUTCOME_LABELS}
    for appel in appels:
        repartition[appel["outcome"]] += 1
    return {
        "calls": appels,
        "counts": repartition,
        "since": depuis.isoformat(),
        "days": jours,
    }


@router.get("/calls/{call_id}")
def fiche(user: CurrentUser, db: DbSession, call_id: int) -> dict:
    appel = db.get(Call, call_id)
    if not appel or appel.organization_id != user.organization.id:
        raise HTTPException(status_code=404, detail="Cette fiche n'existe pas ici.")
    return call_dict(appel)


@router.post("/calls")
def saisir(payload: CallIn, user: CurrentUser, db: DbSession) -> dict:
    """Une fiche tapée à la main : un appel reçu hors standard, tracé quand même."""
    org = user.organization
    ligne = _ligne(db, org.id, payload.line_id)
    phone = normalize_phone(payload.caller_phone) or ""
    appel = Call(
        organization_id=org.id,
        line_id=ligne.id if ligne else None,
        caller_phone=phone,
        caller_name=payload.caller_name,
        started_at=utcnow(),
        duration_sec=payload.duration_sec,
        handled=payload.handled,
        outcome=payload.outcome,
        language=payload.language,
        question=payload.question,
        digit=payload.digit,
        transcript=payload.transcript,
    )
    if not appel.duration_sec:
        appel.duration_sec = switching.duree_dictee(payload.transcript.split("\n"))
    db.add(appel)
    annuaire.enregistre(db, org, phone, payload.caller_name)
    db.commit()
    return call_dict(appel)


@router.post("/standard/ouvrir")
def ouvrir(
    user: CurrentUser,
    db: DbSession,
    line_id: int = Query(ge=1),
    at: datetime | None = Query(default=None),
    langue: str | None = Query(default=None, pattern="^(fr|en)$"),
    caller_phone: str = Query(default="", max_length=24),
) -> dict:
    """Ce que la voix dit à la première seconde, menu compris."""
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    code = switching.code_langue(org, langue)
    return switching.ouvrir(
        db, org, ligne, at or utcnow(), code, normalize_phone(caller_phone) or ""
    )


@router.post("/standard/appeler")
def appeler(payload: SimulateIn, user: CurrentUser, db: DbSession) -> dict:
    """Un appel testé de bout en bout : la voix répond et laisse la fiche."""
    org = user.organization
    ligne = _ligne(db, org.id, payload.line_id)
    moment = payload.at or utcnow()
    start = payload.appointment_start
    if start and start.tzinfo:
        start = start.replace(tzinfo=None)
    resultat = switching.traiter(
        db,
        org,
        ligne,
        caller_phone=payload.caller_phone,
        caller_name=payload.caller_name,
        moment=moment,
        digit=payload.digit,
        question=payload.question,
        service_id=payload.service_id,
        appointment_start=start,
        message_body=payload.message_body,
        urgency=payload.urgency,
        asks_human=payload.asks_human,
        hang_up=payload.hang_up,
        asked_for=payload.asked_for,
        langue=payload.language,
    )
    envois.balayage(db)
    db.commit()
    appel = db.get(Call, resultat["call_id"])
    resultat["call"] = call_dict(appel)
    return resultat
