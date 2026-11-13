from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Patient, User
from ..schemas import (
    CompteEntree,
    OrganisationEntree,
    PatientCorrection,
    PatientEntree,
)
from ..security import hash_password
from ..services import clinic, present

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


@router.get("/patients")
def patients(
    organisation: OrganisationCourante,
    db: DbSession,
    detteurs: bool = False,
) -> dict:
    lignes = clinic.liste_patients(db, organisation, seulement_detteurs=detteurs)
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un["actif"]),
        "patients": lignes,
    }


@router.get("/patients/{patient_id}")
def fiche(
    patient_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return clinic.fiche_patient(db, organisation, patient_id)


@router.post("/patients")
def ajouter_patient(
    entree: PatientEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patient = Patient(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        telephone=entree.telephone,
        naissance=(entree.naissance or "").strip(),
        sexe=entree.sexe.strip(),
        groupe=entree.groupe.strip(),
        allergies=entree.allergies.strip(),
        note=entree.note.strip(),
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return present.patient_dict(patient)


@router.patch("/patients/{patient_id}")
def corriger_patient(
    patient_id: int,
    entree: PatientCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if entree.actif is not None and compte.role != "responsable":
        raise refus("droits", 403)
    patient = clinic.patient_de(db, organisation, patient_id)
    if entree.nom is not None:
        patient.nom = entree.nom.strip()
    if entree.telephone is not None:
        patient.telephone = entree.telephone
    if entree.naissance is not None:
        patient.naissance = (entree.naissance or "").strip()
    if entree.sexe is not None:
        patient.sexe = entree.sexe.strip()
    if entree.groupe is not None:
        patient.groupe = entree.groupe.strip()
    if entree.allergies is not None:
        patient.allergies = entree.allergies.strip()
    if entree.actif is not None:
        patient.actif = entree.actif
    if entree.note is not None:
        patient.note = entree.note.strip()
    db.commit()
    db.refresh(patient)
    return present.patient_dict(patient)
