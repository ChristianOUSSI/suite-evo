from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentUser, DbSession
from ..models import Contact
from ..schemas import ContactIn, ContactPatch
from ..services import contacts as annuaire
from ..services.present import contact_dict
from ..utils import normalize_phone, utcnow

router = APIRouter(tags=["annuaire"])


@router.get("/contacts")
def carnet(
    user: CurrentUser,
    db: DbSession,
    q: str = Query(default="", max_length=60),
    tag: str | None = Query(default=None, max_length=20),
    limit: int = Query(default=120, ge=10, le=400),
) -> dict:
    org = user.organization
    lignes = annuaire.liste(db, org.id, q=q, tag=tag or "", limit=limit)
    return {
        "contacts": [contact_dict(contact) for contact in lignes],
        "tags": [
            {"code": code, "label": label}
            for code, label in annuaire.TAG_LABELS.items()
        ],
        "recognized": sum(contact.call_count for contact in lignes),
        "since": utcnow().isoformat(),
    }


@router.get("/contacts/{contact_id}")
def fiche(contact_id: int, user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    contact = db.get(Contact, contact_id)
    if not contact or contact.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Ce numéro n'est pas au carnet.")
    return contact_dict(contact)


@router.post("/contacts")
def ajouter(payload: ContactIn, user: CurrentUser, db: DbSession) -> dict:
    """La secrétaire note un numéro avant même qu'il n'appelle."""
    org = user.organization
    numero = normalize_phone(payload.phone)
    if not numero:
        raise HTTPException(
            status_code=422, detail="Ce numéro ne correspond pas au plan camerounais."
        )
    jumeau = db.scalar(
        select(Contact.id).where(
            Contact.organization_id == org.id, Contact.phone == numero
        )
    )
    if jumeau:
        raise HTTPException(
            status_code=422, detail="Ce numéro est déjà dans le carnet."
        )
    contact = Contact(
        organization_id=org.id,
        phone=numero,
        name=payload.name,
        tag=payload.tag,
        note=payload.note,
        salutation=payload.salutation,
    )
    db.add(contact)
    db.commit()
    return contact_dict(contact)


@router.patch("/contacts/{contact_id}")
def corriger(
    contact_id: int, payload: ContactPatch, user: CurrentUser, db: DbSession
) -> dict:
    org = user.organization
    contact = db.get(Contact, contact_id)
    if not contact or contact.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Ce numéro n'est pas au carnet.")
    if payload.name is not None:
        contact.name = payload.name
    if payload.tag is not None:
        contact.tag = payload.tag
    if payload.note is not None:
        contact.note = payload.note
    if payload.salutation is not None:
        contact.salutation = payload.salutation
    db.commit()
    return contact_dict(contact)


@router.delete("/contacts/{contact_id}", status_code=204)
def effacer(contact_id: int, user: CurrentUser, db: DbSession) -> None:
    org = user.organization
    contact = db.get(Contact, contact_id)
    if not contact or contact.organization_id != org.id:
        raise HTTPException(status_code=404, detail="Ce numéro n'est pas au carnet.")
    db.delete(contact)
    db.commit()
