from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Answer, Closure, Line, MenuEntry, Schedule, Service
from ..schemas import ClosureIn, HolidayYearIn, LineIn, MenuEntryIn, ScheduleIn
from ..services import calendar_cm as calendrier
from ..services import switching
from ..services.present import closure_dict, line_dict, menu_dict, schedule_dict
from ..utils import utcnow

router = APIRouter(tags=["standard"])


def _ligne(db, org_id: int, line_id: int) -> Line:
    ligne = db.get(Line, line_id)
    if not ligne or ligne.organization_id != org_id:
        raise HTTPException(status_code=404, detail="Ce poste n'existe pas ici.")
    return ligne


@router.get("/lines")
def postes(user: CurrentUser, db: DbSession) -> list[dict]:
    org = user.organization
    return [line_dict(line) for line in org.lines]


@router.get("/lines/{line_id}")
def poste(line_id: int, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    return line_dict(_ligne(db, org.id, line_id), detail=True)


@router.post("/lines")
def ajouter_poste(payload: LineIn, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    ligne = Line(
        organization_id=org.id,
        label=payload.label,
        number=payload.number,
        position=payload.position,
        answered_by_human=payload.answered_by_human,
        capacity=payload.capacity,
    )
    db.add(ligne)
    db.commit()
    return line_dict(ligne, detail=True)


@router.patch("/lines/{line_id}")
def modifier_poste(
    line_id: int, payload: LineIn, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    ligne.label = payload.label
    ligne.number = payload.number
    ligne.position = payload.position
    ligne.answered_by_human = payload.answered_by_human
    ligne.capacity = payload.capacity
    db.commit()
    return line_dict(ligne, detail=True)


@router.delete("/lines/{line_id}", status_code=204)
def supprimer_poste(line_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    if len(org.lines) < 2:
        raise HTTPException(
            status_code=422, detail="Le standard doit garder au moins un poste."
        )
    db.delete(ligne)
    db.commit()


@router.get("/lines/{line_id}/schedules")
def horaires(line_id: int, user: CurrentUser, db: DbSession) -> list[dict]:
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    ordonnes = sorted(ligne.schedules, key=lambda c: (c.weekday, c.opens))
    return [schedule_dict(c) for c in ordonnes]


@router.post("/lines/{line_id}/schedules")
def ajouter_horaire(
    line_id: int, payload: ScheduleIn, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    creneau = Schedule(
        line_id=ligne.id,
        weekday=payload.weekday,
        opens=payload.opens,
        closes=payload.closes,
    )
    db.add(creneau)
    db.commit()
    return schedule_dict(creneau)


@router.delete("/schedules/{schedule_id}", status_code=204)
def supprimer_horaire(schedule_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    creneau = db.get(Schedule, schedule_id)
    if not creneau or creneau.line.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cet horaire n'existe pas ici.")
    db.delete(creneau)
    db.commit()


@router.get("/lines/{line_id}/menu")
def menu(line_id: int, user: CurrentUser, db: DbSession) -> dict:
    """Ce que la voix dictera à la prochaine ouverture."""
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    return {
        "menu": [menu_dict(m) for m in ligne.menu],
        "dictation": switching.lire_menu(ligne),
        "open_now": switching.ouvrir(db, org, ligne, utcnow()),
    }


@router.post("/lines/{line_id}/menu")
def ajouter_touche(
    line_id: int, payload: MenuEntryIn, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    ligne = _ligne(db, org.id, line_id)
    _verifie_cible(db, org.id, payload)
    if any(entry.digit == payload.digit for entry in ligne.menu):
        raise HTTPException(
            status_code=422, detail=f"La touche {payload.digit} est déjà réglée."
        )
    entree = MenuEntry(
        line_id=ligne.id,
        digit=payload.digit,
        label=payload.label,
        label_en=payload.label_en,
        action=payload.action,
        answer_id=payload.answer_id,
        service_id=payload.service_id,
        target_line_id=payload.target_line_id,
    )
    db.add(entree)
    db.commit()
    return menu_dict(entree)


@router.patch("/menu/{entry_id}")
def modifier_touche(
    entry_id: int, payload: MenuEntryIn, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    entree = db.get(MenuEntry, entry_id)
    if not entree or entree.line.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cette touche n'existe pas ici.")
    _verifie_cible(db, org.id, payload)
    conflict = db.scalar(
        select(MenuEntry.id).where(
            MenuEntry.line_id == entree.line_id,
            MenuEntry.digit == payload.digit,
            MenuEntry.id != entry_id,
        )
    )
    if conflict:
        raise HTTPException(
            status_code=422, detail=f"La touche {payload.digit} est déjà réglée."
        )
    entree.digit = payload.digit
    entree.label = payload.label
    entree.label_en = payload.label_en
    entree.action = payload.action
    entree.answer_id = payload.answer_id
    entree.service_id = payload.service_id
    entree.target_line_id = payload.target_line_id
    db.commit()
    return menu_dict(entree)


@router.delete("/menu/{entry_id}", status_code=204)
def supprimer_touche(entry_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    entree = db.get(MenuEntry, entry_id)
    if not entree or entree.line.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cette touche n'existe pas ici.")
    db.delete(entree)
    db.commit()


@router.get("/closures")
def fermetures(user: CurrentUser, db: DbSession) -> list[dict]:
    org = user.organization
    lignes = db.scalars(
        select(Closure)
        .where(Closure.organization_id == org.id)
        .order_by(Closure.starts)
    ).all()
    return [closure_dict(c) for c in lignes]


@router.post("/closures")
def ajouter_fermeture(payload: ClosureIn, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    recouvre = db.scalar(
        select(Closure.id).where(
            Closure.organization_id == org.id,
            Closure.starts <= payload.ends,
            Closure.ends >= payload.starts,
        )
    )
    if recouvre:
        raise HTTPException(
            status_code=422, detail="Une fermeture couvre déjà une partie de ces dates."
        )
    fermeture = Closure(
        organization_id=org.id,
        starts=payload.starts,
        ends=payload.ends,
        reason=payload.reason,
        reason_en=payload.reason_en,
        kind=payload.kind,
    )
    db.add(fermeture)
    db.commit()
    return closure_dict(fermeture)


@router.get("/holidays")
def jours_chomes(
    user: CurrentUser,
    db: DbSession,
    year: int | None = Query(default=None, ge=2024, le=2040),
) -> dict:
    """Le calendrier national, avec ce que l'établissement n'a pas encore posé."""
    org = user.organization
    annee = year or utcnow().year
    deja = set(
        db.scalars(
            select(Closure.starts).where(Closure.organization_id == org.id)
        ).all()
    )
    lignes = [
        {
            "starts": ligne["starts"].isoformat(),
            "reason": ligne["reason"],
            "reason_en": ligne["reason_en"],
            "label": ligne["label"],
            "estimated": ligne["estimated"],
            "already": ligne["starts"] in deja,
        }
        for ligne in calendrier.feries(annee)
    ]
    return {
        "year": annee,
        "covered": list(calendrier.ANNEES_COUCERTES),
        "holidays": lignes,
        "missing": sum(1 for ligne in lignes if not ligne["already"]),
    }


@router.post("/holidays")
def importer_feries(
    payload: HolidayYearIn, user: CurrentUser, db: DbSession
) -> dict:
    """Une touche et l'agenda de l'année est bouché, en français comme en anglais."""
    org = user.organization
    posees = set(
        db.scalars(
            select(Closure.starts).where(Closure.organization_id == org.id)
        ).all()
    )
    ajoutees = []
    for ligne in calendrier.feries(payload.year):
        if ligne["starts"] in posees:
            continue
        fermeture = Closure(
            organization_id=org.id,
            starts=ligne["starts"],
            ends=ligne["ends"],
            reason=ligne["reason"],
            reason_en=ligne["reason_en"],
            kind=ligne["kind"],
        )
        db.add(fermeture)
        db.flush()
        ajoutees.append(closure_dict(fermeture))
        posees.add(ligne["starts"])
    db.commit()
    return {
        "year": payload.year,
        "added": len(ajoutees),
        "closures": ajoutees,
        "skipped": len(calendrier.feries(payload.year)) - len(ajoutees),
    }


@router.delete("/closures/{closure_id}", status_code=204)
def supprimer_fermeture(closure_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    fermeture = db.get(Closure, closure_id)
    if not fermeture or fermeture.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Cette fermeture n'existe pas ici.")
    db.delete(fermeture)
    db.commit()


def _verifie_cible(db, org_id: int, payload: MenuEntryIn) -> None:
    """Une touche ne pointe que vers des fiches du même établissement."""
    if payload.action == "reponse":
        if not payload.answer_id:
            raise HTTPException(
                status_code=422,
                detail="Cette touche doit pointer une réponse du fonds.",
            )
        _existe(db, Answer, payload.answer_id, org_id)
    elif payload.action == "rendezvous":
        if not payload.service_id:
            raise HTTPException(
                status_code=422, detail="Cette touche doit pointer un guichet."
            )
        _existe(db, Service, payload.service_id, org_id)
    elif payload.action == "transfert":
        if not payload.target_line_id:
            raise HTTPException(
                status_code=422, detail="Cette touche doit pointer un autre poste."
            )
        _existe(db, Line, payload.target_line_id, org_id)
    else:
        payload.answer_id = None
        payload.service_id = None
        payload.target_line_id = None


def _existe(db, modele, identifiant: int, org_id: int) -> None:
    cible = db.get(modele, identifiant)
    if not cible or cible.organization_id != org_id:
        raise HTTPException(
            status_code=422,
            detail="Cette touche pointe hors de votre établissement.",
        )
