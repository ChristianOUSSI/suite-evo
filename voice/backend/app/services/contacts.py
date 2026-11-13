"""L'annuaire du standard : les numéros qu'il reconnaît avant qu'ils parlent."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Contact, Organization
from ..utils import normalize_phone, utcnow

TAG_LABELS = {
    "parent": "Parent d'élève",
    "eleve": "Élève ou étudiant",
    "fournisseur": "Fournisseur",
    "medecin": "Médecin ou praticien",
    "administration": "Administration",
    "autre": "Autre contact",
}

PRENOM_TAILLE = 24


def cle(phone: str | None) -> str | None:
    return normalize_phone(phone)


def trouve(db: Session, org_id: int, phone: str | None) -> Contact | None:
    numero = cle(phone)
    if not numero:
        return None
    return db.scalars(
        select(Contact).where(
            Contact.organization_id == org_id, Contact.phone == numero
        )
    ).first()


def enregistre(
    db: Session,
    org: Organization,
    phone: str | None,
    name: str = "",
    *,
    moment: datetime | None = None,
) -> Contact | None:
    """Un appel de plus au compteur, ou une fiche qui naît si le numéro est nouveau."""
    numero = cle(phone)
    if not numero:
        return None
    instant = moment or utcnow()
    contact = trouve(db, org.id, numero)
    if contact is None:
        contact = Contact(
            organization_id=org.id,
            phone=numero,
            name=name.strip()[:140],
            first_seen=instant,
            last_seen=instant,
            call_count=1,
        )
        db.add(contact)
        return contact
    contact.call_count += 1
    contact.last_seen = instant
    if name.strip() and not contact.name:
        contact.name = name.strip()[:140]
    return contact


def prenom(nom: str) -> str:
    parties = [partie for partie in nom.split() if partie]
    if not parties:
        return ""
    return parties[0][:PRENOM_TAILLE]


def dictee(contact: Contact | None) -> str:
    """Comment la voix appelle celui qui vient de taper."""
    if contact is None:
        return ""
    if contact.salutation:
        return contact.salutation[:60]
    given = prenom(contact.name)
    return f"{given}" if given else ""


def liste(
    db: Session, org_id: int, *, q: str = "", tag: str = "", limit: int = 200
) -> list[Contact]:
    clauses = [Contact.organization_id == org_id]
    if tag in TAG_LABELS:
        clauses.append(Contact.tag == tag)
    contacts = db.scalars(
        select(Contact).where(*clauses).order_by(Contact.last_seen.desc())
    ).all()
    if q:
        cherche = q.strip().lower()
        digits = _digits(q)
        contacts = [
            contact
            for contact in contacts
            if cherche in contact.name.lower()
            or cherche in contact.note.lower()
            or (digits and digits in _digits(contact.phone))
        ]
    return list(contacts[:limit])


def _digits(texte: str) -> str:
    return "".join(chiffre for chiffre in texte if chiffre.isdigit())
