from __future__ import annotations

"""Le dépôt de gaz : les clients, les livraisons, la page publique.

Une livraison avance : commandée → en route → livrée, ou annulée.
La page publique crée la commande et le client si besoin.
"""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Livraison, Organisation
from ..schemas import (
    ClientEntree,
    CommandePublique,
    LivraisonCorrection,
    LivraisonEntree,
)
from ..utils import aujourdhui, canonise_telephone, periode_de


def livraison_de(db: Session, organisation: Organisation, livraison_id: int) -> Livraison:
    livraison = db.get(Livraison, livraison_id)
    if livraison is None or livraison.organisation_id != organisation.id:
        raise refus("livraison_inconnue", 404)
    return livraison


def client_de(db: Session, organisation: Organisation, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("client_inconnu", 404)
    return client


def _client_depuis_telephone(
    db: Session, organisation: Organisation, telephone: str
) -> Client:
    """Le client existe déjà par son numéro, ou naît de la commande."""
    client = db.scalar(
        select(Client).where(
            Client.organisation_id == organisation.id,
            Client.telephone == telephone,
        )
    )
    if client is not None:
        return client
    client = Client(
        organisation_id=organisation.id,
        nom=telephone,
        telephone=telephone,
        quartier="",
        type="particulier",
    )
    db.add(client)
    db.flush()
    return client


def enregistrer_livraison(
    db: Session, organisation: Organisation, entree: LivraisonEntree
) -> Livraison:
    client = client_de(db, organisation, entree.client_id)
    livraison = Livraison(
        organisation_id=organisation.id,
        client_id=client.id,
        quantite=entree.quantite,
        prix_unitaire=entree.prix_unitaire,
        statut="commandee",
        date_commande=entree.date_commande or aujourdhui(),
        adresse=entree.adresse.strip(),
        note=entree.note.strip(),
    )
    db.add(livraison)
    db.commit()
    db.refresh(livraison)
    return livraison


def corriger_livraison(
    db: Session, organisation: Organisation, livraison_id: int, patch: dict
) -> Livraison:
    livraison = livraison_de(db, organisation, livraison_id)
    if patch.get("client_id") is not None:
        client_de(db, organisation, patch["client_id"])
    statut = patch.get("statut")
    if statut is not None:
        livraison.statut = statut
        livraison.date_livraison = aujourdhui() if statut == "livree" else None
    elif patch.get("date_livraison") is not None:
        livraison.date_livraison = patch["date_livraison"]
    for cle, valeur in patch.items():
        if cle in ("statut", "date_livraison"):
            continue
        if valeur is not None:
            setattr(livraison, cle, valeur)
    db.commit()
    db.refresh(livraison)
    return livraison


def commande_publique(
    db: Session, organisation: Organisation, entree: CommandePublique
) -> Livraison:
    """La commande passée depuis /commander : le client naît du numéro."""
    client = _client_depuis_telephone(db, organisation, entree.telephone)
    if client.nom == client.telephone and entree.nom.strip():
        client.nom = entree.nom.strip()
    if entree.quartier.strip() and not client.quartier:
        client.quartier = entree.quartier.strip()
    livraison = Livraison(
        organisation_id=organisation.id,
        client_id=client.id,
        quantite=entree.quantite,
        prix_unitaire=0,
        statut="commandee",
        date_commande=aujourdhui(),
        adresse=entree.quartier.strip(),
        note="commande publique",
    )
    db.add(livraison)
    db.commit()
    db.refresh(livraison)
    return livraison


def enregistrer_client(
    db: Session, organisation: Organisation, entree: ClientEntree
) -> Client:
    client = Client(
        organisation_id=organisation.id,
        nom=entree.nom.strip(),
        telephone=entree.telephone,
        quartier=entree.quartier.strip(),
        type=entree.type,
        note=entree.note.strip(),
    )
    db.add(client)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise refus("adresse_prise", 409)
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
    """La vitre du dépôt : les livraisons du jour, ce qui reste à faire."""
    livraisons = db.scalars(
        select(Livraison).where(Livraison.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    auj = aujourdhui()
    periode = periode_de(auj)
    en_cours = [un for un in livraisons if un.statut in ("commandee", "en_route")]
    du_jour = [
        un for un in livraisons
        if un.date_livraison == auj or (un.date_commande == auj and un.statut == "commandee")
    ]
    livrees_mois = [
        un for un in livraisons
        if un.statut == "livree" and un.date_livraison and periode_de(un.date_livraison) == periode
    ]
    return {
        "jour": auj.isoformat(),
        "periode": periode,
        "livraisons": len(livraisons),
        "en_cours": len(en_cours),
        "commandees": sum(1 for un in livraisons if un.statut == "commandee"),
        "en_route": sum(1 for un in livraisons if un.statut == "en_route"),
        "du_jour": len(du_jour),
        "livrees_mois": len(livrees_mois),
        "bonbonnes_mois": sum(un.quantite for un in livrees_mois),
        "montant_mois": sum(un.quantite * un.prix_unitaire for un in livrees_mois),
        "clients": len(clients),
    }


def liste_livraisons(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    client_id: int | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import livraison_dict

    livraisons = list(
        db.scalars(
            select(Livraison)
            .where(Livraison.organisation_id == organisation.id)
            .order_by(Livraison.date_commande.desc(), Livraison.id.desc())
            .limit(limite)
        ).all()
    )
    if statut:
        livraisons = [un for un in livraisons if un.statut == statut]
    if client_id:
        livraisons = [un for un in livraisons if un.client_id == client_id]
    if recherche:
        motif = recherche.strip().lower()
        livraisons = [
            un
            for un in livraisons
            if motif in un.client.nom.lower()
            or motif in un.client.telephone.replace("+237", "").replace(" ", "")
            or motif in un.client.quartier.lower()
            or motif in un.adresse.lower()
            or motif in un.note.lower()
        ]
    return [livraison_dict(un) for un in livraisons]


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
            or motif in un.quartier.lower()
            or motif in un.note.lower()
        ]
    return [client_dict(un) for un in clients]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois du dépôt : livraisons, bonbonnes, par statut et par quartier."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    livraisons = db.scalars(
        select(Livraison).where(Livraison.organisation_id == organisation.id)
    ).all()
    livrees = [
        un for un in livraisons
        if un.statut == "livree" and un.date_livraison and periode_de(un.date_livraison) == periode
    ]
    commandees = [
        un for un in livraisons
        if un.date_commande and periode_de(un.date_commande) == periode
    ]
    par_statut: dict[str, int] = {}
    for un in livraisons:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_quartier: dict[str, int] = {}
    for un in livrees:
        cle = un.client.quartier or un.adresse or "-"
        par_quartier[cle] = par_quartier.get(cle, 0) + un.quantite
    par_type: dict[str, int] = {}
    for un in livrees:
        cle = un.client.type
        par_type[cle] = par_type.get(cle, 0) + un.quantite

    return {
        "periode": periode,
        "livraisons": len(livraisons),
        "livrees_mois": len(livrees),
        "bonbonnes_mois": sum(un.quantite for un in livrees),
        "montant_mois": sum(un.quantite * un.prix_unitaire for un in livrees),
        "commandees_mois": len(commandees),
        "en_cours": sum(1 for un in livraisons if un.statut in ("commandee", "en_route")),
        "par_statut": par_statut,
        "par_quartier": [
            {"quartier": cle, "bonbonnes": n}
            for cle, n in sorted(par_quartier.items(), key=lambda un: -un[1])[:10]
        ],
        "par_type": [
            {"type": cle, "bonbonnes": n}
            for cle, n in sorted(par_type.items(), key=lambda un: -un[1])
        ],
    }
