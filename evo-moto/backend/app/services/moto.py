from __future__ import annotations

"""L'atelier et la vente : les motos, les clients, les réparations.

Une moto entre en vente, se réserve, se vend, se retire. Une
réparation naît reçue, passe en cours, se termine, se livre.
"""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Moto, Organisation, Reparation
from ..schemas import (
    ClientEntree,
    MotoCorrection,
    MotoEntree,
    ReparationCorrection,
    ReparationEntree,
)
from ..utils import aujourdhui, periode_de


def moto_de(db: Session, organisation: Organisation, moto_id: int) -> Moto:
    moto = db.get(Moto, moto_id)
    if moto is None or moto.organisation_id != organisation.id:
        raise refus("moto_inconnue", 404)
    return moto


def client_de(db: Session, organisation: Organisation, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("client_inconnu", 404)
    return client


def reparation_de(db: Session, organisation: Organisation, reparation_id: int) -> Reparation:
    un = db.get(Reparation, reparation_id)
    if un is None or un.organisation_id != organisation.id:
        raise refus("reparation_inconnue", 404)
    return un


def _client_valide(db: Session, organisation: Organisation, client_id: int | None) -> Client | None:
    if client_id is None:
        return None
    return client_de(db, organisation, client_id)


def _moto_valide(db: Session, organisation: Organisation, moto_id: int | None) -> Moto | None:
    if moto_id is None:
        return None
    return moto_de(db, organisation, moto_id)


def enregistrer_moto(
    db: Session, organisation: Organisation, entree: MotoEntree
) -> Moto:
    moto = Moto(
        organisation_id=organisation.id,
        marque=entree.marque.strip(),
        modele=entree.modele.strip(),
        annee=entree.annee,
        kilometrage=entree.kilometrage,
        couleur=entree.couleur.strip(),
        prix=entree.prix,
        statut="en_vente",
        note=entree.note.strip(),
    )
    db.add(moto)
    db.commit()
    db.refresh(moto)
    return moto


def corriger_moto(
    db: Session, organisation: Organisation, moto_id: int, patch: dict
) -> Moto:
    """Le statut pilote la vente : vendu exige un client et une date."""
    moto = moto_de(db, organisation, moto_id)
    statut = patch.get("statut")
    if statut == "vendu":
        client_id = patch.get("client_id") or moto.client_id
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
            setattr(moto, cle, valeur)
        elif valeur is not None:
            setattr(moto, cle, valeur)
    db.commit()
    db.refresh(moto)
    return moto


def enregistrer_reparation(
    db: Session, organisation: Organisation, entree: ReparationEntree
) -> Reparation:
    client = client_de(db, organisation, entree.client_id)
    moto = _moto_valide(db, organisation, entree.moto_id)
    un = Reparation(
        organisation_id=organisation.id,
        client_id=client.id,
        moto_id=moto.id if moto else None,
        immatriculation=entree.immatriculation.strip(),
        panne=entree.panne.strip(),
        travaux=entree.travaux.strip(),
        cout_main_oeuvre=entree.cout_main_oeuvre,
        cout_pieces=entree.cout_pieces,
        statut="recue",
        date_reception=entree.date_reception or aujourdhui(),
        note=entree.note.strip(),
    )
    db.add(un)
    db.commit()
    db.refresh(un)
    return un


def corriger_reparation(
    db: Session, organisation: Organisation, reparation_id: int, patch: dict
) -> Reparation:
    """Le statut pilote la livraison : livree porte sa date."""
    un = reparation_de(db, organisation, reparation_id)
    statut = patch.get("statut")
    if statut == "livree":
        patch.setdefault("date_livraison", aujourdhui())
    elif statut == "recue":
        patch["date_livraison"] = None
    if "moto_id" in patch:
        moto = _moto_valide(db, organisation, patch["moto_id"])
        patch["moto_id"] = moto.id if moto else None
    for cle, valeur in patch.items():
        if cle in ("moto_id", "date_livraison"):
            setattr(un, cle, valeur)
        elif valeur is not None:
            setattr(un, cle, valeur)
    db.commit()
    db.refresh(un)
    return un


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
    """La vitre de l'atelier : le stock, les ventes, les réparations."""
    motos = db.scalars(
        select(Moto).where(Moto.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    reparations = db.scalars(
        select(Reparation).where(Reparation.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    vendues_mois = [
        un for un in motos
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    livrees_mois = [
        un for un in reparations
        if un.statut == "livree" and un.date_livraison and periode_de(un.date_livraison) == periode
    ]
    encaisse_reparations = sum(
        un.cout_main_oeuvre + un.cout_pieces
        for un in reparations
        if un.statut in ("terminee", "livree")
        and (un.date_livraison or aujourdhui()) and periode_de(un.date_livraison or aujourdhui()) == periode
    )
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "motos": len(motos),
        "en_vente": sum(1 for un in motos if un.statut == "en_vente"),
        "reserve": sum(1 for un in motos if un.statut == "reserve"),
        "vendues": sum(1 for un in motos if un.statut == "vendu"),
        "retirees": sum(1 for un in motos if un.statut == "retire"),
        "clients": len(clients),
        "vendues_mois": len(vendues_mois),
        "reparations": len(reparations),
        "reparations_cours": sum(1 for un in reparations if un.statut in ("recue", "en_cours")),
        "livrees_mois": len(livrees_mois),
        "valeur_stock": sum(un.prix for un in motos if un.statut == "en_vente"),
        "valeur_vendue_mois": sum(un.prix for un in vendues_mois),
        "encaisse_atelier_mois": encaisse_reparations,
    }


def liste_motos(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    marque: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import moto_dict

    motos = list(
        db.scalars(
            select(Moto)
            .where(Moto.organisation_id == organisation.id)
            .order_by(Moto.marque, Moto.modele)
            .limit(limite)
        ).all()
    )
    if statut:
        motos = [un for un in motos if un.statut == statut]
    if marque:
        motos = [un for un in motos if un.marque.lower() == marque.lower()]
    if recherche:
        motif = recherche.strip().lower()
        motos = [
            un
            for un in motos
            if motif in un.marque.lower()
            or motif in un.modele.lower()
            or motif in un.couleur.lower()
            or motif in str(un.annee)
            or motif in un.note.lower()
            or motif in (un.client.nom.lower() if un.client else "")
        ]
    return [moto_dict(un) for un in motos]


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


def liste_reparations(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    client_id: int | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import reparation_dict

    reparations = list(
        db.scalars(
            select(Reparation)
            .where(Reparation.organisation_id == organisation.id)
            .order_by(Reparation.date_reception.desc(), Reparation.id.desc())
            .limit(limite)
        ).all()
    )
    if statut:
        reparations = [un for un in reparations if un.statut == statut]
    if client_id:
        reparations = [un for un in reparations if un.client_id == client_id]
    if recherche:
        motif = recherche.strip().lower()
        reparations = [
            un
            for un in reparations
            if motif in un.panne.lower()
            or motif in un.travaux.lower()
            or motif in un.immatriculation.lower()
            or motif in un.note.lower()
            or motif in (un.client.nom.lower() if un.client else "")
            or motif in (un.moto.modele.lower() if un.moto else "")
        ]
    return [reparation_dict(un) for un in reparations]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de l'atelier : ventes, réparations, par statut."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    motos = db.scalars(
        select(Moto).where(Moto.organisation_id == organisation.id)
    ).all()
    reparations = db.scalars(
        select(Reparation).where(Reparation.organisation_id == organisation.id)
    ).all()
    vendues = [
        un for un in motos
        if un.statut == "vendu" and un.date_vente and periode_de(un.date_vente) == periode
    ]
    au_atelier = [
        un for un in reparations
        if un.statut in ("terminee", "livree")
        and periode_de(un.date_livraison or aujourdhui()) == periode
    ]
    par_statut_moto: dict[str, int] = {}
    for un in motos:
        par_statut_moto[un.statut] = par_statut_moto.get(un.statut, 0) + 1
    par_statut_rep: dict[str, int] = {}
    for un in reparations:
        par_statut_rep[un.statut] = par_statut_rep.get(un.statut, 0) + 1
    par_marque: dict[str, int] = {}
    for un in motos:
        par_marque[un.marque] = par_marque.get(un.marque, 0) + 1

    return {
        "periode": periode,
        "motos": len(motos),
        "en_vente": par_statut_moto.get("en_vente", 0),
        "vendues_mois": len(vendues),
        "valeur_vendue_mois": sum(un.prix for un in vendues),
        "valeur_stock": sum(un.prix for un in motos if un.statut == "en_vente"),
        "reparations": len(reparations),
        "reparations_mois": len(au_atelier),
        "encaisse_atelier_mois": sum(un.cout_main_oeuvre + un.cout_pieces for un in au_atelier),
        "par_statut_moto": par_statut_moto,
        "par_statut_rep": par_statut_rep,
        "par_marque": [
            {"marque": cle, "motos": n}
            for cle, n in sorted(par_marque.items(), key=lambda un: -un[1])
        ],
    }



def demande_dict(demande) -> dict:
    """Une demande publique, vue du garage."""
    return {
        "id": demande.id,
        "type": demande.type,
        "moto": f"{demande.moto.marque} {demande.moto.modele}" if demande.moto else "",
        "moto_id": demande.moto_id,
        "client_nom": demande.client_nom,
        "client_telephone": demande.client_telephone,
        "description": demande.description,
        "note": demande.note,
        "statut": demande.statut,
        "cree_le": demande.cree_le.isoformat(timespec="seconds"),
        "traite_le": demande.traite_le.isoformat(timespec="seconds") if demande.traite_le else None,
    }


def ajouter_demande(db: Session, organisation: Organisation, entree) -> "Demande":
    """La demande venue de la page publique : statut « demande »."""
    from ..models import Demande

    if entree.type == "moto" and entree.moto_id is not None:
        moto = moto_de(db, organisation, entree.moto_id)
        if moto.statut != "en_vente":
            raise refus("moto_inconnue", 404)
    demande = Demande(
        organisation_id=organisation.id,
        type=entree.type,
        moto_id=entree.moto_id if entree.type == "moto" else None,
        client_nom=entree.client_nom.strip(),
        client_telephone=entree.client_telephone,
        description=entree.description.strip(),
        note=entree.note.strip(),
    )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande


def liste_demandes(db: Session, organisation: Organisation, statut: str | None = None) -> list:
    from ..models import Demande

    requete = (
        select(Demande)
        .where(Demande.organisation_id == organisation.id)
        .order_by(Demande.id.desc())
    )
    if statut:
        requete = requete.where(Demande.statut == statut)
    return list(db.scalars(requete).all())


def demande_de(db: Session, organisation: Organisation, demande_id: int):
    from ..models import Demande

    demande = db.get(Demande, demande_id)
    if demande is None or demande.organisation_id != organisation.id:
        raise refus("demande_inconnue", 404)
    return demande


def corriger_demande(db: Session, organisation: Organisation, demande_id: int, statut: str):
    if statut not in ("demande", "confirmee", "annulee"):
        raise refus("saisie", statut="demande, confirmee ou annulee")
    demande = demande_de(db, organisation, demande_id)
    demande.statut = statut
    from ..utils import maintenant

    demande.traite_le = maintenant() if statut != "demande" else None
    db.commit()
    db.refresh(demande)
    return demande
