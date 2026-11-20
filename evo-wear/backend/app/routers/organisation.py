from fastapi import APIRouter, Query
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, OrganisationCourante
from ..messages import refus
from ..models import Organisation, User
from ..schemas import (
    ArticleCorrection,
    ArticleEntree,
    DemandeCorrection,
    ClientEntree,
    CompteEntree,
    OrganisationEntree,
)
from ..security import hash_password
from ..services import present, wear as domaine
from ..utils import aujourdhui, periode_de

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


@router.get("/etat")
def etat(organisation: OrganisationCourante, db: DbSession) -> dict:
    return domaine.etat(db, organisation)


@router.get("/recap")
def recap(
    organisation: OrganisationCourante,
    db: DbSession,
    periode: str = Query(default=""),
) -> dict:
    return domaine.recap(db, organisation, periode or periode_de(aujourdhui()))


@router.get("/clients")
def clients(
    organisation: OrganisationCourante,
    db: DbSession,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_clients(db, organisation, recherche=recherche)
    return {"total": len(lignes), "clients": lignes}


@router.post("/clients")
def ajouter_client(
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    client = domaine.enregistrer_client(db, organisation, entree)
    return present.client_dict(client)


@router.patch("/clients/{client_id}")
def corriger_client(
    client_id: int,
    entree: ClientEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    client = domaine.corriger_client(db, organisation, client_id, patch)
    return present.client_dict(client)


@router.get("/articles")
def articles(
    organisation: OrganisationCourante,
    db: DbSession,
    statut: str | None = None,
    categorie: str | None = None,
    recherche: str | None = None,
) -> dict:
    lignes = domaine.liste_articles(
        db,
        organisation,
        statut=statut,
        categorie=categorie,
        recherche=recherche,
    )
    return {
        "total": len(lignes),
        "en_stock": sum(1 for un in lignes if un["statut"] == "en_stock"),
        "vendus": sum(1 for un in lignes if un["statut"] == "vendu"),
        "articles": lignes,
    }


@router.post("/articles")
def ajouter_article(
    entree: ArticleEntree,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    article = domaine.enregistrer_article(db, organisation, entree)
    return present.article_dict(article)


@router.patch("/articles/{article_id}")
def corriger_article(
    article_id: int,
    entree: ArticleCorrection,
    organisation: OrganisationCourante,
    db: DbSession,
) -> dict:
    patch = entree.model_dump(exclude_unset=True)
    if not patch:
        raise refus("saisie")
    article = domaine.corriger_article(db, organisation, article_id, patch)
    return present.article_dict(article)


@router.get("/demandes")
def demandes(db: DbSession, organisation: OrganisationCourante, statut: str | None = None) -> dict:
    rows, en_attente, total = domaine.liste_demandes(db, organisation, statut)
    return {
        "en_attente": en_attente,
        "total": total,
        "demandes": [present.demande_dict(un) for un in rows],
    }


@router.post("/demandes/{demande_id}")
def corriger_demande(
    demande_id: int,
    entree: DemandeCorrection,
    db: DbSession,
    organisation: OrganisationCourante,
) -> dict:
    demande = domaine.demande_de(db, organisation, demande_id)
    demande = domaine.corriger_demande(db, demande, entree.statut or "demande")
    return present.demande_dict(demande)
