from __future__ import annotations

"""La vitrine de la bijouterie : les pièces et les clients.

Une pièce entre en vitrine, se réserve, se vend, se retire. La vente
porte son client et sa date ; le passé ne se réécrit pas.
"""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Organisation, Piece
from ..schemas import ClientEntree, PieceCorrection, PieceEntree
from ..utils import aujourdhui, periode_de

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def piece_de(db: Session, organisation: Organisation, piece_id: int) -> Piece:
    piece = db.get(Piece, piece_id)
    if piece is None or piece.organisation_id != organisation.id:
        raise refus("piece_inconnue", 404)
    return piece


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
        reference = "BJ-" + "".join(secrets.choice(ALPHABET) for _ in range(6))
        if db.scalar(select(Piece.id).where(Piece.reference == reference)) is None:
            return reference
    raise refus("saisie", 500)


def enregistrer_piece(
    db: Session, organisation: Organisation, entree: PieceEntree
) -> Piece:
    piece = Piece(
        organisation_id=organisation.id,
        reference=_reference_libre(db),
        nom=entree.nom.strip(),
        matiere=entree.matiere,
        poids_grammes=entree.poids_grammes,
        carat=entree.carat,
        prix_achat=entree.prix_achat,
        prix_vente=entree.prix_vente,
        statut="en_vitrine",
        fournisseur=entree.fournisseur.strip(),
        note=entree.note.strip(),
    )
    db.add(piece)
    db.commit()
    db.refresh(piece)
    return piece


def corriger_piece(
    db: Session, organisation: Organisation, piece_id: int, patch: dict
) -> Piece:
    """Le statut pilote la vente : vendu exige un client et une date."""
    piece = piece_de(db, organisation, piece_id)
    statut = patch.get("statut")
    if statut == "vendu":
        client_id = patch.get("client_id") or piece.client_id
        if client_id is None:
            raise refus("saisie", **{"client_id": "la vente"})
        patch["client_id"] = client_id
        _client_valide(db, organisation, client_id)
        patch.setdefault("date_vente", aujourdhui())
    elif statut == "en_vitrine":
        patch["client_id"] = None
        patch["date_vente"] = None
    elif statut == "retire":
        pass
    for cle, valeur in patch.items():
        if cle in ("client_id", "date_vente"):
            setattr(piece, cle, valeur)
        elif valeur is not None:
            setattr(piece, cle, valeur)
    db.commit()
    db.refresh(piece)
    return piece


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
    """La vitre de la vitrine : le stock, les ventes du mois."""
    pieces = db.scalars(
        select(Piece).where(Piece.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    vendues_mois = [
        un for un in pieces
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "pieces": len(pieces),
        "en_vitrine": sum(1 for un in pieces if un.statut == "en_vitrine"),
        "reserve": sum(1 for un in pieces if un.statut == "reserve"),
        "vendues": sum(1 for un in pieces if un.statut == "vendu"),
        "retirees": sum(1 for un in pieces if un.statut == "retire"),
        "clients": len(clients),
        "vendues_mois": len(vendues_mois),
        "valeur_stock": sum(un.prix_vente for un in pieces if un.statut == "en_vitrine"),
        "valeur_vendue_mois": sum(un.prix_vente for un in vendues_mois),
    }


def liste_pieces(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    matiere: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import piece_dict

    pieces = list(
        db.scalars(
            select(Piece)
            .where(Piece.organisation_id == organisation.id)
            .order_by(Piece.nom)
            .limit(limite)
        ).all()
    )
    if statut:
        pieces = [un for un in pieces if un.statut == statut]
    if matiere:
        pieces = [un for un in pieces if un.matiere == matiere]
    if recherche:
        motif = recherche.strip().lower()
        pieces = [
            un
            for un in pieces
            if motif in un.nom.lower()
            or motif in un.reference.lower()
            or motif in un.note.lower()
            or motif in un.fournisseur.lower()
            or motif in (un.client.nom.lower() if un.client else "")
        ]
    return [piece_dict(un) for un in pieces]


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
    """Le mois de la vitrine : ventes, par matière et par statut."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    pieces = db.scalars(
        select(Piece).where(Piece.organisation_id == organisation.id)
    ).all()
    vendues = [
        un for un in pieces
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    par_statut: dict[str, int] = {}
    for un in pieces:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_matiere: dict[str, int] = {}
    for un in pieces:
        par_matiere[un.matiere] = par_matiere.get(un.matiere, 0) + 1
    par_matiere_vendue: dict[str, int] = {}
    for un in vendues:
        par_matiere_vendue[un.matiere] = par_matiere_vendue.get(un.matiere, 0) + 1

    return {
        "periode": periode,
        "pieces": len(pieces),
        "en_vitrine": par_statut.get("en_vitrine", 0),
        "vendues_mois": len(vendues),
        "valeur_vendue_mois": sum(un.prix_vente for un in vendues),
        "marge_mois": sum(un.prix_vente - un.prix_achat for un in vendues),
        "valeur_stock": sum(un.prix_vente for un in pieces if un.statut == "en_vitrine"),
        "par_statut": par_statut,
        "par_matiere": [
            {"matiere": cle, "pieces": n}
            for cle, n in sorted(par_matiere.items(), key=lambda un: -un[1])
        ],
        "par_matiere_vendue": [
            {"matiere": cle, "pieces": n}
            for cle, n in sorted(par_matiere_vendue.items(), key=lambda un: -un[1])
        ],
    }
