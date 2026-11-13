from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Classe, Eleve, User
from ..schemas import (
    ClasseCorrection,
    ClasseEntree,
    CompteEntree,
    EleveCorrection,
    EleveEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import ecole, present

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


@router.get("/classes")
def classes(organisation: OrganisationCourante, db: DbSession) -> dict:
    lignes = db.scalars(
        select(Classe)
        .where(Classe.organisation_id == organisation.id)
        .order_by(Classe.nom)
    ).all()
    return {
        "total": len(lignes),
        "actives": sum(1 for un in lignes if un.actif),
        "classes": [present.classe_dict(un) for un in lignes],
    }


@router.post("/classes")
def ajouter_classe(
    entree: ClasseEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    nom = entree.nom.strip()
    prise = db.scalar(
        select(Classe.id).where(
            Classe.organisation_id == organisation.id,
            Classe.nom == nom,
        )
    )
    if prise is not None:
        raise refus("nom_pris")
    classe = Classe(
        organisation_id=organisation.id,
        nom=nom,
        titulaire=entree.titulaire.strip(),
        frais_annuels=entree.frais_annuels,
        note=entree.note.strip(),
    )
    db.add(classe)
    db.commit()
    return present.classe_dict(classe)


@router.patch("/classes/{classe_id}")
def corriger_classe(
    classe_id: int,
    entree: ClasseCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    classe = ecole.classe_de(db, organisation, classe_id)
    if entree.nom is not None and entree.nom.strip() != classe.nom:
        nom = entree.nom.strip()
        prise = db.scalar(
            select(Classe.id).where(
                Classe.organisation_id == organisation.id,
                Classe.nom == nom,
                Classe.id != classe.id,
            )
        )
        if prise is not None:
            raise refus("nom_pris")
        classe.nom = nom
    if entree.titulaire is not None:
        classe.titulaire = entree.titulaire.strip()
    if entree.frais_annuels is not None:
        classe.frais_annuels = entree.frais_annuels
    if entree.actif is not None:
        classe.actif = entree.actif
    if entree.note is not None:
        classe.note = entree.note.strip()
    db.commit()
    return present.classe_dict(classe)


@router.get("/eleves")
def eleves(
    organisation: OrganisationCourante,
    db: DbSession,
    classe_id: int | None = None,
    restants: bool = False,
) -> dict:
    lignes = ecole.liste_eleves(db, organisation, classe_id=classe_id, seulement_restants=restants)
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un["actif"]),
        "eleves": lignes,
    }


@router.post("/eleves")
def ajouter_eleve(
    entree: EleveEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    classe = ecole.classe_de(db, organisation, entree.classe_id)
    if not classe.actif:
        raise refus("classe_inconnue", 404)

    if entree.matricule:
        prise = db.scalar(
            select(Eleve.id).where(
                Eleve.organisation_id == organisation.id,
                Eleve.matricule == entree.matricule,
            )
        )
        if prise is not None:
            raise refus("nom_pris")

    frais = entree.frais_attendu if entree.frais_attendu is not None else classe.frais_annuels
    eleve = Eleve(
        organisation_id=organisation.id,
        classe_id=classe.id,
        nom=entree.nom.strip(),
        matricule=entree.matricule.strip(),
        parent_nom=entree.parent_nom.strip(),
        parent_telephone=entree.parent_telephone,
        frais_attendu=frais,
        note=entree.note.strip(),
    )
    db.add(eleve)
    db.commit()
    db.refresh(eleve)
    return present.eleve_dict(eleve)


@router.patch("/eleves/{eleve_id}")
def corriger_eleve(
    eleve_id: int,
    entree: EleveCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    eleve = ecole.eleve_de(db, organisation, eleve_id)
    if entree.classe_id is not None and entree.classe_id != eleve.classe_id:
        classe = ecole.classe_de(db, organisation, entree.classe_id)
        if not classe.actif:
            raise refus("classe_inconnue", 404)
        eleve.classe_id = classe.id
    if entree.matricule is not None and entree.matricule != eleve.matricule:
        matricule = entree.matricule.strip()
        if matricule:
            prise = db.scalar(
                select(Eleve.id).where(
                    Eleve.organisation_id == organisation.id,
                    Eleve.matricule == matricule,
                    Eleve.id != eleve.id,
                )
            )
            if prise is not None:
                raise refus("nom_pris")
        eleve.matricule = matricule
    if entree.nom is not None:
        eleve.nom = entree.nom.strip()
    if entree.parent_nom is not None:
        eleve.parent_nom = entree.parent_nom.strip()
    if entree.parent_telephone is not None:
        eleve.parent_telephone = entree.parent_telephone
    if entree.frais_attendu is not None:
        eleve.frais_attendu = entree.frais_attendu
    if entree.actif is not None:
        eleve.actif = entree.actif
    if entree.note is not None:
        eleve.note = entree.note.strip()
    db.commit()
    db.refresh(eleve)
    return present.eleve_dict(eleve)
