from datetime import timedelta

from fastapi import APIRouter, Query, Response
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Appointment, Call, Closure, Message
from ..services import contacts as annuaire
from ..services import export
from ..services.present import (
    appointment_dict,
    call_dict,
    closure_dict,
    contact_dict,
    message_dict,
)
from ..utils import utcnow

router = APIRouter(tags=["exports"])

TYPE_CSV = "text/csv; charset=utf-8"
MAX_LIGNES = 4000


def _reponse(texte: str, nom: str) -> Response:
    return Response(
        content=texte,
        media_type=TYPE_CSV,
        headers={"Content-Disposition": f'attachment; filename="{nom}"'},
    )


@router.get("/exports/calls.csv")
def exporter_journal(
    user: CurrentUser,
    db: DbSession,
    jours: int = Query(default=14, ge=1, le=120),
    line_id: int | None = Query(default=None),
    outcome: str | None = Query(default=None, max_length=20),
) -> Response:
    org = user.organization
    depuis = utcnow() - timedelta(days=jours)
    clauses = [Call.organization_id == org.id, Call.started_at >= depuis]
    if line_id:
        clauses.append(Call.line_id == line_id)
    if outcome:
        clauses.append(Call.outcome == outcome)
    fiches = db.scalars(
        select(Call).where(*clauses).order_by(Call.started_at.desc()).limit(MAX_LIGNES)
    ).all()
    texte = export.journal([call_dict(fiche) for fiche in fiches])
    return _reponse(texte, export.nom_fichier(org.name, "journal"))


@router.get("/exports/messages.csv")
def exporter_main_courante(
    user: CurrentUser,
    db: DbSession,
    statut: str | None = Query(default=None, max_length=12),
) -> Response:
    org = user.organization
    clauses = [Message.organization_id == org.id]
    if statut:
        clauses.append(Message.status == statut)
    lignes = db.scalars(
        select(Message).where(*clauses).order_by(Message.promised_at).limit(MAX_LIGNES)
    ).all()
    texte = export.main_courante([message_dict(mot) for mot in lignes])
    return _reponse(texte, export.nom_fichier(org.name, "main-courante"))


@router.get("/exports/appointments.csv")
def exporter_agenda(
    user: CurrentUser,
    db: DbSession,
    horizon: str = Query(default="futur", pattern="^(futur|passe|tous)$"),
) -> Response:
    org = user.organization
    clauses = [Appointment.organization_id == org.id]
    if horizon == "futur":
        clauses.append(Appointment.starts_at >= utcnow())
    elif horizon == "passe":
        clauses.append(Appointment.starts_at < utcnow())
    lignes = db.scalars(
        select(Appointment)
        .where(*clauses)
        .order_by(Appointment.starts_at)
        .limit(MAX_LIGNES)
    ).all()
    texte = export.agenda([appointment_dict(place) for place in lignes])
    return _reponse(texte, export.nom_fichier(org.name, "agenda"))


@router.get("/exports/contacts.csv")
def exporter_annuaire(user: CurrentUser, db: DbSession) -> Response:
    org = user.organization
    lignes = annuaire.liste(db, org.id, limit=MAX_LIGNES)
    texte = export.annuaire([contact_dict(contact) for contact in lignes])
    return _reponse(texte, export.nom_fichier(org.name, "annuaire"))


@router.get("/exports/closures.csv")
def exporter_fermetures(user: CurrentUser, db: DbSession) -> Response:
    org = user.organization
    lignes = db.scalars(
        select(Closure)
        .where(Closure.organization_id == org.id)
        .order_by(Closure.starts)
    ).all()
    rangees = []
    for fermeture in lignes:
        mot = closure_dict(fermeture)
        rangees.append(
            [
                mot["starts"],
                mot["ends"],
                mot["reason"],
                mot["reason_en"],
                mot["kind_label"],
                mot["days"],
            ]
        )
    texte = export.tableau(
        ["Début", "Fin", "Motif", "Reason", "Nature", "Jours"], rangees
    )
    return _reponse(texte, export.nom_fichier(org.name, "fermetures"))
