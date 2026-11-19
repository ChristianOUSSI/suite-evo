from __future__ import annotations

"""Le quai du transitaire : les envois, leur numéro, leur parcours.

Un envoi a un numéro de suivi à dix signes ; chaque passage de statut
laisse une ligne dans le suivi. Le passé ne se réécrit pas.
"""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Client, Envoi, Organisation, Suivi
from ..schemas import ClientEntree, EnvoiEntree, SuiviEntree
from ..utils import aujourdhui, periode_de

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def _numero(db: Session) -> str:
    for _ in range(40):
        code = "".join(secrets.choice(ALPHABET) for _ in range(10))
        if db.scalar(select(Envoi.id).where(Envoi.numero_suivi == code)) is None:
            return code
    raise refus("saisie")


def envoi_de(db: Session, organisation: Organisation, envoi_id: int) -> Envoi:
    envoi = db.get(Envoi, envoi_id)
    if envoi is None or envoi.organisation_id != organisation.id:
        raise refus("envoi_inconnu", 404)
    return envoi


def _client_valide(db: Session, organisation: Organisation, client_id: int | None) -> Client | None:
    if client_id is None:
        return None
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("saisie", **{"client_id": "le client"})
    return client


def enregistrer_envoi(
    db: Session, organisation: Organisation, entree: EnvoiEntree
) -> Envoi:
    jour = entree.date_envoi or aujourdhui()
    if jour > aujourdhui():
        raise refus("saisie", **{"date_envoi": "le jour"})
    _client_valide(db, organisation, entree.client_id)

    envoi = Envoi(
        organisation_id=organisation.id,
        numero_suivi=_numero(db),
        description=entree.description.strip(),
        mode=entree.mode,
        expéditeur_nom=entree.expéditeur_nom.strip(),
        expéditeur_pays=entree.expéditeur_pays.strip(),
        destinataire_nom=entree.destinataire_nom.strip(),
        destinataire_ville=entree.destinataire_ville.strip(),
        poids_kg=entree.poids_kg,
        valeur_declaree=entree.valeur_declaree,
        frais=entree.frais,
        client_id=entree.client_id,
        date_envoi=jour,
        note=entree.note.strip(),
    )
    db.add(envoi)
    db.flush()
    db.add(Suivi(envoi_id=envoi.id, statut="en_attente", note="Envoi enregistré au quai."))
    db.commit()
    db.refresh(envoi)
    return envoi


def avancer_envoi(
    db: Session, organisation: Organisation, envoi_id: int, entree: SuiviEntree
) -> Envoi:
    """Le statut avance : une ligne de suivi, jamais de réécriture."""
    envoi = envoi_de(db, organisation, envoi_id)
    db.add(
        Suivi(
            envoi_id=envoi.id,
            statut=entree.statut,
            note=entree.note.strip(),
        )
    )
    envoi.statut = entree.statut
    if entree.statut == "livre":
        envoi.date_livraison = aujourdhui()
    elif entree.statut in ("bloque", "annule"):
        pass
    db.commit()
    db.refresh(envoi)
    return envoi


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
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("client_inconnu", 404)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(client, cle, valeur)
    db.commit()
    db.refresh(client)
    return client


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre du quai : les envois, les statuts, le chiffre du mois."""
    envois = db.scalars(
        select(Envoi).where(Envoi.organisation_id == organisation.id)
    ).all()
    clients = db.scalars(
        select(Client).where(Client.organisation_id == organisation.id)
    ).all()
    periode = periode_de(aujourdhui())
    envois_mois = [un for un in envois if periode_de(un.date_envoi) == periode]
    livres_mois = [un for un in envois_mois if un.statut == "livre"]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": periode,
        "envois": len(envois),
        "en_attente": sum(1 for un in envois if un.statut == "en_attente"),
        "en_transit": sum(1 for un in envois if un.statut == "en_transit"),
        "en_douane": sum(1 for un in envois if un.statut == "en_douane"),
        "bloques": sum(1 for un in envois if un.statut == "bloque"),
        "livres": sum(1 for un in envois if un.statut == "livre"),
        "clients": len(clients),
        "envois_mois": len(envois_mois),
        "frais_mois": sum(un.frais for un in envois_mois),
        "livres_mois": len(livres_mois),
    }


def liste_envois(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    mode: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import envoi_dict

    requete = (
        select(Envoi)
        .where(Envoi.organisation_id == organisation.id)
        .order_by(Envoi.date_envoi.desc(), Envoi.id.desc())
        .limit(limite)
    )
    envois = list(db.scalars(requete).all())
    if statut:
        envois = [un for un in envois if un.statut == statut]
    if mode:
        envois = [un for un in envois if un.mode == mode]
    if recherche:
        motif = recherche.strip().lower()
        envois = [
            un
            for un in envois
            if motif in un.numero_suivi.lower()
            or motif in un.description.lower()
            or motif in un.destinataire_nom.lower()
            or motif in un.destinataire_ville.lower()
            or motif in un.expéditeur_nom.lower()
            or motif in un.note.lower()
        ]
    return [envoi_dict(un) for un in envois]


def fiche_envoi(db: Session, organisation: Organisation, envoi_id: int) -> dict:
    from .present import envoi_dict

    return envoi_dict(envoi_de(db, organisation, envoi_id))


def par_numero(db: Session, numero: str) -> Envoi | None:
    return db.scalar(select(Envoi).where(Envoi.numero_suivi == numero.strip().upper()))


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
    """Le mois du quai : envois, frais, par mode et par statut."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    envois = db.scalars(
        select(Envoi).where(Envoi.organisation_id == organisation.id)
    ).all()
    du_mois = [un for un in envois if periode_de(un.date_envoi) == periode]
    par_statut: dict[str, int] = {}
    for un in du_mois:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    par_mode: dict[str, int] = {}
    for un in du_mois:
        par_mode[un.mode] = par_mode.get(un.mode, 0) + 1
    par_ville: dict[str, int] = {}
    for un in du_mois:
        ville = un.destinataire_ville or "-"
        par_ville[ville] = par_ville.get(ville, 0) + 1

    return {
        "periode": periode,
        "envois": len(envois),
        "envois_mois": len(du_mois),
        "frais_mois": sum(un.frais for un in du_mois),
        "valeur_mois": sum(un.valeur_declaree for un in du_mois),
        "par_statut": par_statut,
        "par_mode": [
            {"mode": cle, "envois": n}
            for cle, n in sorted(par_mode.items(), key=lambda un: -un[1])
        ],
        "par_ville": [
            {"ville": cle, "envois": n}
            for cle, n in sorted(par_ville.items(), key=lambda un: -un[1])[:10]
        ],
    }
