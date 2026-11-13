from __future__ import annotations

"""Le parc et le stock : les voitures, les pièces, les clients.

Une voiture entre en vente, se réserve, se vend, se retire. Une
pièce descend en stock à la vente, se réapprovisionne.
"""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Organisation, Piece, Voiture
from ..schemas import (
    ClientEntree,
    PieceCorrection,
    PieceEntree,
    VoitureCorrection,
    VoitureEntree,
)
from ..utils import aujourdhui, periode_de

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def voiture_de(db: Session, organisation: Organisation, voiture_id: int) -> Voiture:
    voiture = db.get(Voiture, voiture_id)
    if voiture is None or voiture.organisation_id != organisation.id:
        raise refus("voiture_inconnue", 404)
    return voiture


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
        reference = "PC-" + "".join(secrets.choice(ALPHABET) for _ in range(6))
        if db.scalar(select(Piece.id).where(Piece.reference == reference)) is None:
            return reference
    raise refus("saisie", 500)


def enregistrer_voiture(
    db: Session, organisation: Organisation, entree: VoitureEntree
) -> Voiture:
    voiture = Voiture(
        organisation_id=organisation.id,
        marque=entree.marque.strip(),
        modele=entree.modele.strip(),
        annee=entree.annee,
        kilometrage=entree.kilometrage,
        carburant=entree.carburant,
        boite=entree.boite,
        prix=entree.prix,
        statut="en_vente",
        note=entree.note.strip(),
    )
    db.add(voiture)
    db.commit()
    db.refresh(voiture)
    return voiture


def corriger_voiture(
    db: Session, organisation: Organisation, voiture_id: int, patch: dict
) -> Voiture:
    """Le statut pilote la vente : vendu exige un client et une date."""
    voiture = voiture_de(db, organisation, voiture_id)
    statut = patch.get("statut")
    if statut == "vendu":
        client_id = patch.get("client_id") or voiture.client_id
        if client_id is None:
            raise refus("saisie", **{"client_id": "la vente"})
        patch["client_id"] = client_id
        _client_valide(db, organisation, client_id)
        patch.setdefault("date_vente", aujourdhui())
    elif statut == "en_vente":
        patch["client_id"] = None
        patch["date_vente"] = None
    for cle, valeur in patch.items():
        if cle in ("client_id", "date_vente"):
            setattr(voiture, cle, valeur)
        elif valeur is not None:
            setattr(voiture, cle, valeur)
    db.commit()
    db.refresh(voiture)
    return voiture


def enregistrer_piece(
    db: Session, organisation: Organisation, entree: PieceEntree
) -> Piece:
    piece = Piece(
        organisation_id=organisation.id,
        reference=_reference_libre(db),
        designation=entree.designation.strip(),
        compatibilite=entree.compatibilite.strip(),
        stock=entree.stock,
        prix_achat=entree.prix_achat,
        prix_vente=entree.prix_vente,
        statut="en_stock" if entree.stock > 0 else "epuise",
        note=entree.note.strip(),
    )
    db.add(piece)
    db.commit()
    db.refresh(piece)
    return piece


def corriger_piece(
    db: Session, organisation: Organisation, piece_id: int, patch: dict
) -> Piece:
    """La vente d'une pièce porte son client ; le stock ne ment pas."""
    piece = piece_de(db, organisation, piece_id)
    statut = patch.get("statut")
    if statut == "vendu":
        client_id = patch.get("client_id") or piece.client_id
        if client_id is None:
            raise refus("saisie", **{"client_id": "la vente"})
        patch["client_id"] = client_id
        _client_valide(db, organisation, client_id)
        quantite = patch.get("quantite_vendue")
        if quantite is None:
            quantite = piece.stock
            patch["quantite_vendue"] = quantite
        if quantite <= 0 or quantite > piece.stock:
            raise refus("stock_insuffisant", 422)
        patch["stock"] = piece.stock - quantite
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
    # Un réassort garde le client et la date : ce ne sont pas des champs de stock.
    for cle, valeur in patch.items():
        if cle in ("client_id", "date_vente", "quantite_vendue"):
            setattr(piece, cle, valeur)
        elif valeur is not None:
            setattr(piece, cle, valeur)
    if piece.stock > 0 and piece.statut == "epuise" and statut != "vendu":
        piece.statut = "en_stock"
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
    """La vitre du garage : le parc, le stock, les ventes du mois."""
    voitures = db.scalars(
        select(Voiture).where(Voiture.organisation_id == organisation.id)
    ).all()
    pieces = db.scalars(
        select(Piece).where(Piece.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    vendues_mois = [
        un for un in voitures
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    pieces_vendues_mois = [
        un for un in pieces
        if un.date_vente and periode_de(un.date_vente) == periode and un.quantite_vendue > 0
    ]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "voitures": len(voitures),
        "en_vente": sum(1 for un in voitures if un.statut == "en_vente"),
        "reserve": sum(1 for un in voitures if un.statut == "reserve"),
        "vendues": sum(1 for un in voitures if un.statut == "vendu"),
        "retirees": sum(1 for un in voitures if un.statut == "retire"),
        "pieces": len(pieces),
        "en_stock": sum(1 for un in pieces if un.statut == "en_stock"),
        "epuisees": sum(1 for un in pieces if un.statut == "epuise"),
        "clients": len(clients),
        "vendues_mois": len(vendues_mois),
        "pieces_vendues_mois": len(pieces_vendues_mois),
        "valeur_stock": sum(un.prix for un in voitures if un.statut == "en_vente"),
        "valeur_pieces": sum(un.prix_vente * un.stock for un in pieces if un.statut == "en_stock"),
        "valeur_vendue_mois": sum(un.prix for un in vendues_mois),
        "encaisse_pieces_mois": sum(un.prix_vente * un.quantite_vendue for un in pieces_vendues_mois),
    }


def liste_voitures(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    marque: str | None = None,
    carburant: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import voiture_dict

    voitures = list(
        db.scalars(
            select(Voiture)
            .where(Voiture.organisation_id == organisation.id)
            .order_by(Voiture.marque, Voiture.modele)
            .limit(limite)
        ).all()
    )
    if statut:
        voitures = [un for un in voitures if un.statut == statut]
    if marque:
        voitures = [un for un in voitures if un.marque.lower() == marque.lower()]
    if carburant:
        voitures = [un for un in voitures if un.carburant == carburant]
    if recherche:
        motif = recherche.strip().lower()
        voitures = [
            un
            for un in voitures
            if motif in un.marque.lower()
            or motif in un.modele.lower()
            or motif in str(un.annee)
            or motif in un.note.lower()
            or motif in (un.client.nom.lower() if un.client else "")
        ]
    return [voiture_dict(un) for un in voitures]


def liste_pieces(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import piece_dict

    pieces = list(
        db.scalars(
            select(Piece)
            .where(Piece.organisation_id == organisation.id)
            .order_by(Piece.designation)
            .limit(limite)
        ).all()
    )
    if statut:
        pieces = [un for un in pieces if un.statut == statut]
    if recherche:
        motif = recherche.strip().lower()
        pieces = [
            un
            for un in pieces
            if motif in un.designation.lower()
            or motif in un.reference.lower()
            or motif in un.compatibilite.lower()
            or motif in un.note.lower()
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
    """Le mois du garage : voitures, pièces, par marque et par statut."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    voitures = db.scalars(
        select(Voiture).where(Voiture.organisation_id == organisation.id)
    ).all()
    pieces = db.scalars(
        select(Piece).where(Piece.organisation_id == organisation.id)
    ).all()
    vendues = [
        un for un in voitures
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    pieces_vendues = [
        un for un in pieces
        if un.date_vente and periode_de(un.date_vente) == periode and un.quantite_vendue > 0
    ]
    par_statut_v: dict[str, int] = {}
    for un in voitures:
        par_statut_v[un.statut] = par_statut_v.get(un.statut, 0) + 1
    par_statut_p: dict[str, int] = {}
    for un in pieces:
        par_statut_p[un.statut] = par_statut_p.get(un.statut, 0) + 1
    par_marque: dict[str, int] = {}
    for un in voitures:
        par_marque[un.marque] = par_marque.get(un.marque, 0) + 1

    return {
        "periode": periode,
        "voitures": len(voitures),
        "en_vente": par_statut_v.get("en_vente", 0),
        "vendues_mois": len(vendues),
        "valeur_vendue_mois": sum(un.prix for un in vendues),
        "valeur_stock": sum(un.prix for un in voitures if un.statut == "en_vente"),
        "pieces": len(pieces),
        "en_stock": par_statut_p.get("en_stock", 0),
        "pieces_vendues_mois": len(pieces_vendues),
        "quantite_vendue_mois": sum(un.quantite_vendue for un in pieces_vendues),
        "encaisse_pieces_mois": sum(un.prix_vente * un.quantite_vendue for un in pieces_vendues),
        "valeur_pieces": sum(un.prix_vente * un.stock for un in pieces if un.statut == "en_stock"),
        "par_statut_voiture": par_statut_v,
        "par_statut_piece": par_statut_p,
        "par_marque": [
            {"marque": cle, "voitures": n}
            for cle, n in sorted(par_marque.items(), key=lambda un: -un[1])
        ],
    }
