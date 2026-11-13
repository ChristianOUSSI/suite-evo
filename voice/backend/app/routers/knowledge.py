from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import or_, select

from ..deps import CurrentUser, DbSession
from ..models import Answer, Appointment, MenuEntry, Service, ServiceDay
from ..schemas import AnswerIn, QuestionIn, ServiceIn
from ..services import gaps, switching
from ..services.present import answer_dict, service_dict
from ..utils import utcnow

router = APIRouter(tags=["répertoire et guichets"])


@router.get("/answers")
def fiches(
    user: CurrentUser,
    db: DbSession,
    q: str = Query(default="", max_length=80),
    domaine: str | None = Query(default=None, max_length=60),
) -> dict:
    org = user.organization
    clauses = [Answer.organization_id == org.id]
    if domaine:
        clauses.append(Answer.area == domaine)
    if q.strip():
        filtre = f"%{q.strip()}%"
        clauses.append(
            or_(Answer.statement.ilike(filtre), Answer.keywords.ilike(filtre))
        )
    lignes = db.scalars(
        select(Answer).where(*clauses).order_by(Answer.hits.desc(), Answer.statement)
    ).all()
    return {
        "answers": [answer_dict(a) for a in lignes],
        "areas": sorted({a.area for a in lignes}),
    }


@router.get("/answers/trous")
def trous(
    user: CurrentUser,
    db: DbSession,
    jours: int = Query(default=gaps.FENETRE_JOURS, ge=3, le=120),
) -> dict:
    """Ce que les appelants demandent et que le fonds ne sait pas encore dire."""
    org = user.organization
    rangees = gaps.trous(db, org, jours=jours)
    for rangee in rangees:
        rangee["suggestion"] = gaps.suggestiaire(rangee)
    return {
        "since_days": jours,
        "holes": rangees,
        "to_fill": sum(1 for rangee in rangees if rangee["repeated"]),
        "suggested": gaps.suggestiaire(rangees[0]) if rangees else None,
    }


@router.get("/answers/{answer_id}")
def fiche(answer_id: int, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    answer = db.get(Answer, answer_id)
    if not answer or answer.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cette réponse n'existe pas ici.")
    touches = [
        {"digit": m.digit, "line_id": m.line_id}
        for m in db.scalars(
            select(MenuEntry).where(MenuEntry.answer_id == answer_id)
        )
    ]
    data = answer_dict(answer)
    data["used_by"] = touches
    return data


@router.post("/answers")
def ecrire_fiche(payload: AnswerIn, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    answer = Answer(
        organization_id=org.id,
        statement=payload.statement,
        keywords=payload.keywords,
        body=payload.body,
        statement_en=payload.statement_en,
        keywords_en=payload.keywords_en,
        body_en=payload.body_en,
        area=payload.area,
        follow_up=payload.follow_up,
        updated_at=utcnow(),
    )
    db.add(answer)
    db.commit()
    return answer_dict(answer)


@router.patch("/answers/{answer_id}")
def corriger_fiche(
    answer_id: int, payload: AnswerIn, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    answer = db.get(Answer, answer_id)
    if not answer or answer.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cette réponse n'existe pas ici.")
    answer.statement = payload.statement
    answer.keywords = payload.keywords
    answer.body = payload.body
    answer.statement_en = payload.statement_en
    answer.keywords_en = payload.keywords_en
    answer.body_en = payload.body_en
    answer.area = payload.area
    answer.follow_up = payload.follow_up
    answer.updated_at = utcnow()
    db.commit()
    return answer_dict(answer)


@router.delete("/answers/{answer_id}", status_code=204)
def supprimer_fiche(answer_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    answer = db.get(Answer, answer_id)
    if not answer or answer.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cette réponse n'existe pas ici.")
    db.delete(answer)
    db.commit()


@router.post("/answers/tester")
def tester(payload: QuestionIn, user: CurrentUser, db: DbSession) -> dict:
    """Ce que répondrait la voix à une phrase tapée dans la console."""
    org = user.organization
    question = payload.question
    code = switching.code_langue(org, payload.language)
    answer = switching.trouve_reponse(db, org.id, question, code)
    if not answer:
        return {
            "found": False,
            "language": code,
            "score": 0,
            "mots": sorted(switching.mots(question))[:12],
            "fallback": switching.lire_menu(org.lines[0], code) if org.lines else "",
        }
    texte = answer.body_en if code == "en" and answer.body_en else answer.body
    return {
        "found": True,
        "language": code,
        "answer": answer_dict(answer),
        "dictation": switching.dictee(texte),
    }


@router.get("/services")
def guichets(user: CurrentUser, db: DbSession) -> list[dict]:
    org = user.organization
    return [service_dict(db, service) for service in org.services]


@router.get("/services/{service_id}")
def guichet(service_id: int, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    service = _service(db, org.id, service_id)
    return service_dict(db, service, detail=True)


@router.post("/services")
def ouvrir_guichet(payload: ServiceIn, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    service = Service(
        organization_id=org.id,
        name=payload.name,
        room=payload.room,
        duration_min=payload.duration_min,
        step_min=payload.step_min,
        lead_days=payload.lead_days,
        horizon_days=payload.horizon_days,
        note=payload.note,
    )
    db.add(service)
    db.flush()
    _jours(db, service, payload)
    db.commit()
    return service_dict(db, service, detail=True)


@router.patch("/services/{service_id}")
def regler_guichet(
    service_id: int, payload: ServiceIn, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    service = _service(db, org.id, service_id)
    service.name = payload.name
    service.room = payload.room
    service.duration_min = payload.duration_min
    service.step_min = payload.step_min
    service.lead_days = payload.lead_days
    service.horizon_days = payload.horizon_days
    service.note = payload.note
    for ancien in list(service.days):
        db.delete(ancien)
    db.flush()
    _jours(db, service, payload)
    db.commit()
    db.refresh(service)
    return service_dict(db, service, detail=True)


@router.delete("/services/{service_id}", status_code=204)
def fermer_guichet(service_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    service = _service(db, org.id, service_id)
    pris = db.scalar(
        select(Appointment.id).where(
            Appointment.service_id == service_id,
            Appointment.status == "confirme",
            Appointment.starts_at >= utcnow(),
        )
    )
    if pris:
        raise HTTPException(
            status_code=422,
            detail="Des rendez-vous tiennent encore sur ce guichet.",
        )
    db.delete(service)
    db.commit()


def _jours(db, service: Service, payload: ServiceIn) -> None:
    vus: set[tuple[int, str]] = set()
    for jour in payload.days:
        cle = (jour.weekday, jour.opens.isoformat())
        if cle in vus:
            continue
        vus.add(cle)
        db.add(
            ServiceDay(
                service_id=service.id,
                weekday=jour.weekday,
                opens=jour.opens,
                closes=jour.closes,
            )
        )


def _service(db, org_id: int, service_id: int) -> Service:
    service = db.get(Service, service_id)
    if not service or service.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Ce guichet n'existe pas ici.")
    return service
