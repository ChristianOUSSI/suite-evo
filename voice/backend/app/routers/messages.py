from datetime import timedelta

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Message
from ..schemas import MessageIn, MessagePatch
from ..services import contacts as annuaire
from ..services import dispatch as envois
from ..services import switching
from ..services.present import message_dict
from ..utils import normalize_phone, utcnow

router = APIRouter(tags=["main courante"])

STATUTS = ("nouveau", "en_cours", "rappelle")


@router.get("/messages")
def file(
    user: CurrentUser,
    db: DbSession,
    statut: str | None = Query(default=None),
    seulement_en_retard: bool = Query(default=False),
) -> dict:
    org = user.organization
    clauses = [Message.organization_id == org.id]
    if statut in STATUTS:
        clauses.append(Message.status == statut)
    lignes = db.scalars(
        select(Message).where(*clauses).order_by(Message.promised_at)
    ).all()
    mots = [message_dict(m) for m in lignes]
    if seulement_en_retard:
        mots = [m for m in mots if m["overdue"]]
    return {
        "messages": mots,
        "late": sum(1 for m in mots if m["overdue"]),
        "open": sum(1 for m in mots if m["status"] != "rappelle"),
    }


@router.post("/messages")
def laisser(payload: MessageIn, user: CurrentUser, db: DbSession) -> dict:
    """Un mot noté au comptoir ou au téléphone, avec la fenêtre de rappel."""
    org = user.organization
    maintenant = utcnow()
    if payload.promised_at:
        promise = payload.promised_at.replace(tzinfo=None)
    else:
        minutes = payload.promised_in_minutes or org.callback_minutes
        promise = maintenant + timedelta(minutes=minutes)
    mot = Message(
        organization_id=org.id,
        line_id=payload.line_id,
        from_name=payload.from_name,
        from_phone=normalize_phone(payload.from_phone) or payload.from_phone,
        body=payload.body,
        urgency=payload.urgency,
        language=payload.language or switching.code_langue(org),
        promised_at=promise,
        created_at=maintenant,
    )
    db.add(mot)
    db.flush()
    annuaire.enregistre(db, org, mot.from_phone, mot.from_name, moment=maintenant)
    envois.accuser_message(db, org, mot, code=mot.language)
    db.commit()
    return message_dict(mot)


@router.patch("/messages/{message_id}")
def modifier(
    message_id: int, payload: MessagePatch, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    mot = db.get(Message, message_id)
    if not mot or mot.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Ce message n'existe pas ici.")
    if payload.status and payload.status not in STATUTS:
        raise HTTPException(status_code=422, detail="Statut de message inconnu.")
    if payload.status:
        mot.status = payload.status
        if payload.status == "rappelle":
            mot.recalled_at = utcnow()
            if not mot.handled_by:
                mot.handled_by = user.name
    if payload.handled_by is not None:
        mot.handled_by = payload.handled_by
    if payload.handled_note is not None:
        mot.handled_note = payload.handled_note
    db.commit()
    return message_dict(mot)


@router.delete("/messages/{message_id}", status_code=204)
def effacer(message_id: int, user: CurrentUser, db: DbSession) -> None:
    mot = db.get(Message, message_id)
    if not mot or mot.organization_id != user.organization.id:
        raise HTTPException(status_code=404, detail="Ce message n'existe pas ici.")
    db.delete(mot)
    db.commit()
