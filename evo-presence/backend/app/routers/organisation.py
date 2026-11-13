from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Employe, User
from ..schemas import CompteEntree, EmployeCorrection, EmployeEntree, OrganisationEntree
from ..security import hash_password
from ..services import presence, present

router = APIRouter(tags=["maison"])


@router.get("/organisation")
def lecture(organisation: OrganisationCourante) -> dict:
    return present.organisation_dict(organisation)


@router.put("/organisation")
def ecrire(
    entree: OrganisationEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    organisation.nom = entree.nom.strip()
    organisation.ville = entree.ville.strip()
    organisation.quartier = entree.quartier.strip()
    organisation.telephone = entree.telephone
    db.commit()
    return present.organisation_dict(organisation)


@router.get("/comptes")
def comptes(organisation: OrganisationCourante, db: DbSession) -> list[dict]:
    lignes = db.scalars(
        select(User).where(User.organisation_id == organisation.id).order_by(User.nom)
    ).all()
    return [present.compte_dict(un) for un in lignes]


@router.post("/comptes")
def ajouter_compte(
    entree: CompteEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    email = entree.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise refus("adresse_prise")
    nouveau = User(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        email=email,
        mot_de_passe=hash_password(entree.mot_de_passe),
        role=entree.role,
    )
    db.add(nouveau)
    db.commit()
    return present.compte_dict(nouveau)


@router.get("/employes")
def employes(organisation: OrganisationCourante, db: DbSession) -> dict:
    lignes = db.scalars(
        select(Employe).where(Employe.organisation_id == organisation.id).order_by(Employe.nom)
    ).all()
    actifs = [un for un in lignes if un.actif]
    return {
        "total": len(lignes),
        "actifs": len(actifs),
        "employes": [present.employe_dict(un) for un in lignes],
    }


@router.post("/employes")
def ajouter_employe(
    entree: EmployeEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if entree.telephone:
        prise = db.scalar(
            select(Employe.id).where(
                Employe.organisation_id == organisation.id,
                Employe.telephone == entree.telephone,
            )
        )
        if prise is not None:
            raise refus("meme_telephone")
    employe = Employe(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        telephone=entree.telephone,
        service=entree.service.strip(),
        note=entree.note.strip(),
    )
    db.add(employe)
    db.commit()
    return present.employe_dict(employe)


@router.patch("/employes/{employe_id}")
def corriger_employe(
    employe_id: int,
    entree: EmployeCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Sortir quelqu'un de la liste ne touche pas ses journées pointées."""
    employe = presence.employe_de(db, organisation, employe_id)
    if entree.actif is not None and compte.role != "responsable":
        raise refus("droits", 403)
    if entree.telephone is not None and entree.telephone != employe.telephone:
        if entree.telephone:
            prise = db.scalar(
                select(Employe.id).where(
                    Employe.organisation_id == organisation.id,
                    Employe.telephone == entree.telephone,
                    Employe.id != employe.id,
                )
            )
            if prise is not None:
                raise refus("meme_telephone")
        employe.telephone = entree.telephone
    if entree.nom is not None:
        employe.nom = entree.nom.strip()
    if entree.service is not None:
        employe.service = entree.service.strip()
    if entree.actif is not None:
        employe.actif = entree.actif
    if entree.note is not None:
        employe.note = entree.note.strip()
    db.commit()
    return present.employe_dict(employe)
