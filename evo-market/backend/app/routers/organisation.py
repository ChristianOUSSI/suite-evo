from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import User
from ..schemas import AnnonceEntree, AnnonceCorrection, CompteEntree, OrganisationEntree
from ..security import hash_password
from ..services import market, present

router = APIRouter(tags=["boutique"])


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


@router.get("/annonces")
def annonces(
    organisation: OrganisationCourante,
    db: DbSession,
    categorie: str | None = None,
    statut: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = market.liste_annonces(
        db, organisation, categorie=categorie, statut=statut, recherche=recherche
    )
    return {
        "total": len(lignes),
        "en_ligne": sum(1 for un in lignes if un["statut"] == "en_ligne"),
        "annonces": lignes,
    }


@router.get("/annonces/{annonce_id}")
def fiche(
    annonce_id: int,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    return market.fiche_annonce(db, organisation, annonce_id)


@router.post("/annonces")
def ajouter_annonce(
    entree: AnnonceEntree,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    annonce = market.Annonce(
        organisation_id=organisation.id,
        titre=entree.titre.strip(),
        categorie=entree.categorie,
        description=entree.description.strip(),
        prix=entree.prix,
        stock=entree.stock,
        ville=entree.ville.strip(),
        quartier=entree.quartier.strip(),
        vendeur_nom=entree.vendeur_nom.strip(),
        vendeur_telephone=entree.vendeur_telephone,
        note=entree.note.strip(),
    )
    db.add(annonce)
    db.commit()
    db.refresh(annonce)
    return present.annonce_dict(annonce)


@router.patch("/annonces/{annonce_id}")
def corriger_annonce(
    annonce_id: int,
    entree: AnnonceCorrection,
    organisation: OrganisationCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    annonce = market.annonce_de(db, organisation, annonce_id)
    patch = entree.model_dump(exclude_unset=True)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(annonce, cle, valeur.strip() if isinstance(valeur, str) else valeur)
    db.commit()
    db.refresh(annonce)
    return present.annonce_dict(annonce)
