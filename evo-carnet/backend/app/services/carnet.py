from __future__ import annotations

"""Le carnet numérique : les notes, leurs catégories, leurs partages.

Une note s'épingle, se range, s'archive. Le code de partage ouvre une
page publique en lecture seule - la note voyage sur WhatsApp sans
compte.
"""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Note, Organisation
from ..schemas import NoteCorrection, NoteEntree
from ..utils import aujourdhui, periode_de
from .present import note_dict


def note_de(db: Session, organisation: Organisation, note_id: int) -> Note:
    note = db.get(Note, note_id)
    if note is None or note.organisation_id != organisation.id:
        raise refus("note_inconnue", 404)
    return note


def _nouveau_code(db: Session) -> str:
    for _ in range(20):
        code = secrets.token_hex(5).upper()
        if db.scalar(select(Note.id).where(Note.code_partage == code)) is None:
            return code
    raise refus("saisie")


def enregistrer_note(
    db: Session, organisation: Organisation, entree: NoteEntree
) -> Note:
    note = Note(
        organisation_id=organisation.id,
        titre=entree.titre.strip(),
        contenu=entree.contenu.strip(),
        categorie=entree.categorie,
        code_partage=_nouveau_code(db),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def corriger_note(
    db: Session, organisation: Organisation, note_id: int, patch: dict
) -> Note:
    note = note_de(db, organisation, note_id)
    if patch.get("nouveau_code"):
        patch["code_partage"] = _nouveau_code(db)
    for cle, valeur in patch.items():
        if cle == "nouveau_code":
            continue
        if valeur is not None:
            setattr(note, cle, valeur)
    db.commit()
    db.refresh(note)
    return note


def note_partagee(db: Session, code: str) -> Note | None:
    return db.scalar(select(Note).where(Note.code_partage == code.strip().upper()))


def etat(db: Session, organisation: Organisation) -> dict:
    notes = db.scalars(
        select(Note).where(Note.organisation_id == organisation.id)
    ).all()
    actives = [un for un in notes if not un.archivee]
    epinglees = [un for un in actives if un.epinglee]
    return {
        "jour": aujourdhui().isoformat(),
        "notes": len(actives),
        "archivees": sum(1 for un in notes if un.archivee),
        "epinglees": len(epinglees),
        "mots": sum(len(un.contenu.split()) for un in actives),
        "categories": len({un.categorie for un in actives}),
    }


def liste_notes(
    db: Session,
    organisation: Organisation,
    categorie: str | None = None,
    recherche: str | None = None,
    archivees: bool = False,
    limite: int = 500,
) -> list[dict]:
    notes = list(
        db.scalars(
            select(Note)
            .where(Note.organisation_id == organisation.id)
            .order_by(Note.epinglee.desc(), Note.maj_le.desc())
            .limit(limite)
        ).all()
    )
    notes = [un for un in notes if un.archivee == archivees]
    if categorie:
        notes = [un for un in notes if un.categorie == categorie]
    if recherche:
        motif = recherche.strip().lower()
        notes = [
            un
            for un in notes
            if motif in un.titre.lower()
            or motif in un.contenu.lower()
            or motif in un.categorie.lower()
        ]
    return [note_dict(un) for un in notes]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois du carnet : notes écrites, par catégorie, mots."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    notes = db.scalars(
        select(Note).where(Note.organisation_id == organisation.id)
    ).all()
    du_mois = [
        un for un in notes
        if un.maj_le and periode_de(un.maj_le.date()) == periode
    ]
    par_categorie: dict[str, int] = {}
    for un in du_mois:
        par_categorie[un.categorie] = par_categorie.get(un.categorie, 0) + 1

    return {
        "periode": periode,
        "notes": len([un for un in notes if not un.archivee]),
        "archivees": sum(1 for un in notes if un.archivee),
        "epinglees": sum(1 for un in notes if un.epinglee and not un.archivee),
        "ecrites_mois": len(du_mois),
        "mots_mois": sum(len(un.contenu.split()) for un in du_mois),
        "par_categorie": [
            {"categorie": cle, "notes": n}
            for cle, n in sorted(par_categorie.items(), key=lambda un: -un[1])
        ],
    }
