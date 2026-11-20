from __future__ import annotations

"""Le parc du concessionnaire : les véhicules et les clients.

Un véhicule entre en vente, se réserve, se vend, se retire. La vente
porte son client et sa date ; le passé ne se réécrit pas.
"""

import re

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Demande, Organisation, STATUTS_DEMANDE, Vehicule
from ..schemas import ClientEntree, DemandeCorrection, DemandeEntree, VehiculeCorrection, VehiculeEntree
from ..utils import aujourdhui, maintenant, periode_de


def vehicule_de(db: Session, organisation: Organisation, vehicule_id: int) -> Vehicule:
    vehicule = db.get(Vehicule, vehicule_id)
    if vehicule is None or vehicule.organisation_id != organisation.id:
        raise refus("vehicule_inconnu", 404)
    return vehicule


def client_de(db: Session, organisation: Organisation, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("client_inconnu", 404)
    return client


def _client_valide(db: Session, organisation: Organisation, client_id: int | None) -> Client | None:
    if client_id is None:
        return None
    return client_de(db, organisation, client_id)


def enregistrer_vehicule(
    db: Session, organisation: Organisation, entree: VehiculeEntree
) -> Vehicule:
    vehicule = Vehicule(
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
    db.add(vehicule)
    db.commit()
    db.refresh(vehicule)
    return vehicule


def corriger_vehicule(
    db: Session, organisation: Organisation, vehicule_id: int, patch: dict
) -> Vehicule:
    """Le statut pilote la vente : vendu exige un client et une date."""
    vehicule = vehicule_de(db, organisation, vehicule_id)
    statut = patch.get("statut")
    if statut == "vendu":
        client_id = patch.get("client_id") or vehicule.client_id
        if client_id is None:
            raise refus("saisie", **{"client_id": "la vente"})
        patch["client_id"] = client_id
        _client_valide(db, organisation, client_id)
        patch.setdefault("date_vente", aujourdhui())
    elif statut == "en_vente":
        patch["client_id"] = None
        patch["date_vente"] = None
    elif statut == "retire":
        pass
    for cle, valeur in patch.items():
        if cle in ("client_id", "date_vente"):
            setattr(vehicule, cle, valeur)
        elif valeur is not None:
            setattr(vehicule, cle, valeur)
    db.commit()
    db.refresh(vehicule)
    return vehicule


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
    """La vitre du parc : le stock, les ventes du mois."""
    vehicules = db.scalars(
        select(Vehicule).where(Vehicule.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    vendus_mois = [
        un for un in vehicules
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "vehicules": len(vehicules),
        "en_vente": sum(1 for un in vehicules if un.statut == "en_vente"),
        "reserve": sum(1 for un in vehicules if un.statut == "reserve"),
        "vendus": sum(1 for un in vehicules if un.statut == "vendu"),
        "retirés": sum(1 for un in vehicules if un.statut == "retire"),
        "clients": len(clients),
        "vendus_mois": len(vendus_mois),
        "valeur_stock": sum(un.prix for un in vehicules if un.statut == "en_vente"),
        "valeur_vendue_mois": sum(un.prix for un in vendus_mois),
    }


def liste_vehicules(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    marque: str | None = None,
    carburant: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import vehicule_dict

    requete = (
        select(Vehicule)
        .where(Vehicule.organisation_id == organisation.id)
        .order_by(Vehicule.marque, Vehicule.modele)
        .limit(limite)
    )
    vehicules = list(db.scalars(requete).all())
    if statut:
        vehicules = [un for un in vehicules if un.statut == statut]
    if marque:
        vehicules = [un for un in vehicules if un.marque.lower() == marque.lower()]
    if carburant:
        vehicules = [un for un in vehicules if un.carburant == carburant]
    if recherche:
        motif = recherche.strip().lower()
        vehicules = [
            un
            for un in vehicules
            if motif in un.marque.lower()
            or motif in un.modele.lower()
            or motif in str(un.annee)
            or motif in un.note.lower()
            or motif in (un.client.nom.lower() if un.client else "")
        ]
    return [vehicule_dict(un) for un in vehicules]


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
    """Le mois du parc : stock, ventes, par marque et par carburant."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    vehicules = db.scalars(
        select(Vehicule).where(Vehicule.organisation_id == organisation.id)
    ).all()
    vendus = [
        un for un in vehicules
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    par_statut: dict[str, int] = {}
    for un in vehicules:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_marque: dict[str, int] = {}
    for un in vehicules:
        par_marque[un.marque] = par_marque.get(un.marque, 0) + 1
    par_carburant: dict[str, int] = {}
    for un in vehicules:
        par_carburant[un.carburant] = par_carburant.get(un.carburant, 0) + 1

    return {
        "periode": periode,
        "vehicules": len(vehicules),
        "en_vente": par_statut.get("en_vente", 0),
        "vendus_mois": len(vendus),
        "valeur_vendue_mois": sum(un.prix for un in vendus),
        "valeur_stock": sum(un.prix for un in vehicules if un.statut == "en_vente"),
        "par_statut": par_statut,
        "par_marque": [
            {"marque": cle, "vehicules": n}
            for cle, n in sorted(par_marque.items(), key=lambda un: -un[1])
        ],
        "par_carburant": [
            {"carburant": cle, "vehicules": n}
            for cle, n in sorted(par_carburant.items(), key=lambda un: -un[1])
        ],
    }


def demande_publique(db: Session, organisation: Organisation, entree: DemandeEntree) -> Demande:
    """Le visiteur qui demande un véhicule depuis la page publique."""
    vehicule = None
    if entree.vehicule_id is not None:
        vehicule = db.get(Vehicule, entree.vehicule_id)
        if vehicule is None or vehicule.organisation_id != organisation.id:
            vehicule = None
    demande = Demande(
        organisation_id=organisation.id,
        vehicule_id=vehicule.id if vehicule else None,
        client_nom=entree.client_nom.strip(),
        client_telephone=entree.client_telephone.strip(),
        note=entree.note.strip(),
    )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande


def liste_demandes(
    db: Session, organisation: Organisation, statut: str | None = None
) -> tuple[list[Demande], int, int]:
    requete = select(Demande).where(Demande.organisation_id == organisation.id)
    if statut:
        requete = requete.where(Demande.statut == statut)
    rows = list(db.scalars(requete.order_by(Demande.cree_le.desc())).all())
    en_attente = db.scalar(
        select(func.count())
        .select_from(Demande)
        .where(Demande.organisation_id == organisation.id, Demande.statut == "demande")
    ) or 0
    return rows, en_attente, len(rows)


def demande_de(db: Session, organisation: Organisation, demande_id: int) -> Demande:
    demande = db.get(Demande, demande_id)
    if demande is None or demande.organisation_id != organisation.id:
        raise refus("demande_inconnue", 404)
    return demande


def corriger_demande(db: Session, demande: Demande, statut: str) -> Demande:
    if statut not in STATUTS_DEMANDE:
        raise refus("demande_statut", 422)
    demande.statut = statut
    demande.traite_le = maintenant()
    db.commit()
    db.refresh(demande)
    return demande
