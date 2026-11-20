from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import User
from ..schemas import (
    CompteEntree,
    DemandeCorrection,
    DocumentCorrection,
    DocumentEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import docs, present

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


@router.get("/documents")
def documents(
    organisation: OrganisationCourante,
    db: DbSession,
    categorie: str | None = None,
    statut: str | None = None,
    echeance: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = docs.liste_documents(
        db,
        organisation,
        categorie=categorie,
        statut=statut,
        echeance=echeance,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un["statut"] == "actif"),
        "en_retard": sum(1 for un in lignes if un["en_retard"]),
        "documents": lignes,
    }


@router.get("/documents/{document_id}")
def fiche(
    document_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return docs.fiche_document(db, organisation, document_id)


@router.post("/documents")
def ajouter_document(
    entree: DocumentEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    document = docs.enregistrer_document(db, organisation, entree, compte)
    return present.document_dict(document)


@router.patch("/documents/{document_id}")
def corriger_document(
    document_id: int,
    entree: DocumentCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    document = docs.corriger_document(db, organisation, document_id, patch)
    return present.document_dict(document)


@router.get("/demandes")
def demandes(organisation: OrganisationCourante, db: DbSession) -> dict:
    """Les demandes de documents venues de la page publique."""
    lignes = docs.liste_demandes(db, organisation)
    return {"demandes": [docs.demande_dict(un) for un in lignes]}


@router.patch("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    """L'équipe prépare, remet ou refuse la demande."""
    demande = docs.traiter_demande(db, organisation, demande_id, entree)
    return docs.demande_dict(demande)
