from __future__ import annotations

"""La boutique : les articles de prêt-à-porter, les clientes.

Chaque taille et chaque couleur est une ligne de stock. La vente
descend le stock, porte sa cliente et sa date — le stock ne ment
jamais.
"""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Article, Client, Organisation
from ..schemas import ArticleCorrection, ArticleEntree, ClientEntree
from ..utils import aujourdhui, periode_de

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def article_de(db: Session, organisation: Organisation, article_id: int) -> Article:
    article = db.get(Article, article_id)
    if article is None or article.organisation_id != organisation.id:
        raise refus("article_inconnu", 404)
    return article


def client_de(db: Session, organisation: Organisation, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("client_inconnu", 404)
    return client


def _client_valide(db: Session, organisation: Organisation, client_id: int | None) -> Client | None:
    if client_id is None:
        return None
    return client_de(db, organisation, client_id)


def _reference_libre(db: Session) -> str:
    for _ in range(20):
        reference = "PT-" + "".join(secrets.choice(ALPHABET) for _ in range(6))
        if db.scalar(select(Article.id).where(Article.reference == reference)) is None:
            return reference
    raise refus("saisie", 500)


def enregistrer_article(
    db: Session, organisation: Organisation, entree: ArticleEntree
) -> Article:
    article = Article(
        organisation_id=organisation.id,
        reference=_reference_libre(db),
        nom=entree.nom.strip(),
        categorie=entree.categorie,
        taille=entree.taille,
        couleur=entree.couleur.strip(),
        stock=entree.stock,
        prix_achat=entree.prix_achat,
        prix_vente=entree.prix_vente,
        statut="en_stock" if entree.stock > 0 else "epuise",
        note=entree.note.strip(),
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


def corriger_article(
    db: Session, organisation: Organisation, article_id: int, patch: dict
) -> Article:
    """La vente d'un article porte sa cliente ; le stock ne ment pas."""
    article = article_de(db, organisation, article_id)
    statut = patch.get("statut")
    if statut == "vendu":
        client_id = patch.get("client_id") or article.client_id
        if client_id is None:
            raise refus("saisie", **{"client_id": "la vente"})
        patch["client_id"] = client_id
        _client_valide(db, organisation, client_id)
        quantite = patch.get("quantite_vendue")
        if quantite is None:
            quantite = article.stock
            patch["quantite_vendue"] = quantite
        if quantite <= 0 or quantite > article.stock:
            raise refus("stock_insuffisant", 422)
        patch["stock"] = article.stock - quantite
        patch.setdefault("date_vente", aujourdhui())
        if patch["stock"] == 0:
            patch["statut"] = "epuise"
    elif statut == "en_stock":
        patch["client_id"] = None
        patch["date_vente"] = None
        patch["quantite_vendue"] = 0
    elif statut == "epuise":
        patch["client_id"] = None
        patch["date_vente"] = None
    for cle, valeur in patch.items():
        if cle in ("client_id", "date_vente", "quantite_vendue"):
            setattr(article, cle, valeur)
        elif valeur is not None:
            setattr(article, cle, valeur)
    if article.stock > 0 and article.statut == "epuise" and statut != "vendu":
        article.statut = "en_stock"
    db.commit()
    db.refresh(article)
    return article


def enregistrer_client(
    db: Session, organisation: Organisation, entree: ClientEntree
) -> Client:
    client = Client(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        telephone=entree.telephone,
        type=entree.type,
        note=entree.note.strip(),
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def corriger_client(
    db: Session, organisation: Organisation, client_id: int, patch: dict
) -> Client:
    client = client_de(db, organisation, client_id)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(client, cle, valeur)
    db.commit()
    db.refresh(client)
    return client


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de la boutique : le stock, les ventes du mois."""
    articles = db.scalars(
        select(Article).where(Article.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    vendus_mois = [
        un for un in articles
        if un.date_vente and periode_de(un.date_vente) == periode and un.quantite_vendue > 0
    ]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "articles": len(articles),
        "en_stock": sum(1 for un in articles if un.statut == "en_stock"),
        "epuisees": sum(1 for un in articles if un.statut == "epuise"),
        "unites_stock": sum(un.stock for un in articles if un.statut == "en_stock"),
        "clients": len(clients),
        "vendus_mois": len(vendus_mois),
        "quantite_vendue_mois": sum(un.quantite_vendue for un in vendus_mois),
        "valeur_stock": sum(un.prix_vente * un.stock for un in articles if un.statut == "en_stock"),
        "encaisse_mois": sum(un.prix_vente * un.quantite_vendue for un in vendus_mois),
    }


def liste_articles(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    categorie: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import article_dict

    articles = list(
        db.scalars(
            select(Article)
            .where(Article.organisation_id == organisation.id)
            .order_by(Article.categorie, Article.nom)
            .limit(limite)
        ).all()
    )
    if statut:
        articles = [un for un in articles if un.statut == statut]
    if categorie:
        articles = [un for un in articles if un.categorie == categorie]
    if recherche:
        motif = recherche.strip().lower()
        articles = [
            un
            for un in articles
            if motif in un.nom.lower()
            or motif in un.reference.lower()
            or motif in un.couleur.lower()
            or motif in un.taille.lower()
            or motif in un.note.lower()
            or motif in (un.client.nom.lower() if un.client else "")
        ]
    return [article_dict(un) for un in articles]


def liste_clients(
    db: Session,
    organisation: Organisation,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import client_dict

    clients = list(
        db.scalars(
            select(Client)
            .where(Client.organisation_id == organisation.id)
            .order_by(Client.nom)
            .limit(limite)
        ).all()
    )
    if recherche:
        motif = recherche.strip().lower()
        clients = [
            un
            for un in clients
            if motif in un.nom.lower()
            or motif in un.telephone.replace("+237", "").replace(" ", "")
            or motif in un.note.lower()
        ]
    return [client_dict(un) for un in clients]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de la boutique : ventes, stock, par catégorie et statut."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    articles = db.scalars(
        select(Article).where(Article.organisation_id == organisation.id)
    ).all()
    vendus = [
        un for un in articles
        if un.date_vente and periode_de(un.date_vente) == periode and un.quantite_vendue > 0
    ]
    par_statut: dict[str, int] = {}
    for un in articles:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_categorie: dict[str, int] = {}
    for un in articles:
        par_categorie[un.categorie] = par_categorie.get(un.categorie, 0) + 1
    par_couleur: dict[str, int] = {}
    for un in vendus:
        cle = un.couleur or "—"
        par_couleur[cle] = par_couleur.get(cle, 0) + un.quantite_vendue

    return {
        "periode": periode,
        "articles": len(articles),
        "en_stock": par_statut.get("en_stock", 0),
        "vendus_mois": len(vendus),
        "quantite_vendue_mois": sum(un.quantite_vendue for un in vendus),
        "encaisse_mois": sum(un.prix_vente * un.quantite_vendue for un in vendus),
        "valeur_stock": sum(un.prix_vente * un.stock for un in articles if un.statut == "en_stock"),
        "unites_stock": sum(un.stock for un in articles if un.statut == "en_stock"),
        "par_statut": par_statut,
        "par_categorie": [
            {"categorie": cle, "articles": n}
            for cle, n in sorted(par_categorie.items(), key=lambda un: -un[1])
        ],
        "par_couleur": [
            {"couleur": cle, "quantite": n}
            for cle, n in sorted(par_couleur.items(), key=lambda un: -un[1])[:8]
        ],
    }
