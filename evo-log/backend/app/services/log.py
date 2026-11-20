from __future__ import annotations

"""Le registre du transporteur : les colis et leurs numéros de suivi.

Trois règles :

1. Le numéro de suivi est unique et se dicte au téléphone : dix signes,
   alphabet sans I, O, 0 ni 1. Il sert deux fois - à l'agent pour retrouver
   le colis, au destinataire pour le suivre sur /suivi.
2. Le statut avance à la main : reçu → en transit → arrivé → distribué.
   Retourné et annulé existent pour la vie réelle ; distribué pose la date
   de livraison toute seule.
3. Les compteurs se recalculent à la lecture : rien à désynchroniser.
"""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Demande, Colis, Organisation, User
from ..schemas import ColisEntree, DemandeEnvoiEntree
from ..security import ALPHABET
from ..utils import aujourdhui, periode_de

ORDRE = ("recu", "en_transit", "arrive", "distribue")


def colis_de(db: Session, organisation: Organisation, colis_id: int) -> Colis:
    colis = db.get(Colis, colis_id)
    if colis is None or colis.organisation_id != organisation.id:
        raise refus("colis_inconnu", 404)
    return colis


def colis_par_numero(db: Session, organisation: Organisation, numero: str) -> Colis:
    colis = db.scalar(
        select(Colis).where(
            Colis.organisation_id == organisation.id,
            Colis.numero == numero.strip().upper(),
        )
    )
    if colis is None:
        raise refus("colis_inconnu", 404)
    return colis


def _numero(db: Session, organisation: Organisation) -> str:
    """Dix signes, uniques dans le transporteur, dicibles au téléphone."""
    for _ in range(50):
        nombre = secrets.randbelow(30**10)
        sortie = []
        for _ in range(10):
            nombre, reste = divmod(nombre, len(ALPHABET))
            sortie.append(ALPHABET[reste])
        candidat = "".join(sortie)
        if not db.scalar(
            select(Colis.id).where(
                Colis.organisation_id == organisation.id, Colis.numero == candidat
            )
        ):
            return candidat
    raise refus("numero_pris")


def deposer(db: Session, organisation: Organisation, entree: ColisEntree, compte: User) -> Colis:
    """Un dépôt : l'expéditeur, le destinataire, le trajet, les frais."""
    jour = entree.date_depot or aujourdhui()
    if jour > aujourdhui():
        raise refus("saisie", date_depot="le jour")

    colis = Colis(
        organisation_id=organisation.id,
        numero=_numero(db, organisation),
        genre=entree.genre,
        description=entree.description.strip(),
        poids_kg=entree.poids_kg,
        expediteur_nom=entree.expediteur_nom.strip(),
        expediteur_telephone=entree.expediteur_telephone,
        destinataire_nom=entree.destinataire_nom.strip(),
        destinataire_telephone=entree.destinataire_telephone,
        depart=entree.depart,
        arrivee=entree.arrivee,
        frais=entree.frais,
        moyen=entree.moyen,
        date_depot=jour,
        note=entree.note.strip(),
        agent_id=compte.id,
        cree_par=compte.id,
    )
    db.add(colis)
    db.commit()
    db.refresh(colis)
    return colis


def corriger(db: Session, organisation: Organisation, colis_id: int, patch: dict) -> Colis:
    colis = colis_de(db, organisation, colis_id)
    statut = patch.get("statut")
    if statut is not None:
        if statut == "distribue" and colis.statut != "distribue":
            patch["date_livraison"] = aujourdhui()
        elif statut != "distribue":
            patch["date_livraison"] = None
    for cle, valeur in patch.items():
        if valeur is not None or cle in ("date_livraison",):
            setattr(colis, cle, valeur)
    db.commit()
    db.refresh(colis)
    return colis


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre du transporteur : les colis, par statut, du jour et du mois."""
    ce_mois = periode_de(aujourdhui())
    colis = db.scalars(
        select(Colis).where(Colis.organisation_id == organisation.id)
    ).all()
    aujourdhui_d = aujourdhui()
    par_statut: dict[str, int] = {}
    for un in colis:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1
    return {
        "jour": aujourdhui_d.isoformat(),
        "periode": ce_mois,
        "colis": len(colis),
        "en_transit": par_statut.get("en_transit", 0),
        "arrives": par_statut.get("arrive", 0),
        "distribues_mois": sum(
            1 for un in colis if un.statut == "distribue" and periode_de(un.date_depot) == ce_mois
        ),
        "deposes_mois": sum(1 for un in colis if periode_de(un.date_depot) == ce_mois),
        "frais_mois": sum(
            un.frais for un in colis if un.moyen != "a_payer" and periode_de(un.date_depot) == ce_mois
        ),
        "a_percevoir": sum(un.frais for un in colis if un.moyen == "a_payer"),
        "par_statut": par_statut,
    }


def liste_colis(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    genre: str | None = None,
    trajet: str | None = None,
    periode: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import colis_dict

    requete = (
        select(Colis)
        .where(Colis.organisation_id == organisation.id)
        .order_by(Colis.date_depot.desc(), Colis.id.desc())
        .limit(limite)
    )
    colis = list(db.scalars(requete).all())
    if statut:
        colis = [un for un in colis if un.statut == statut]
    if genre:
        colis = [un for un in colis if un.genre == genre]
    if trajet:
        colis = [un for un in colis if un.depart == trajet or un.arrivee == trajet]
    if periode:
        colis = [un for un in colis if periode_de(un.date_depot) == periode]
    if recherche:
        motif = recherche.strip().lower()
        colis = [
            un
            for un in colis
            if motif in un.numero.lower()
            or motif in un.destinataire_nom.lower()
            or motif in un.expediteur_nom.lower()
            or motif in un.description.lower()
        ]
    return [colis_dict(un) for un in colis]


def fiche_colis(db: Session, organisation: Organisation, colis_id: int) -> dict:
    from .present import colis_dict

    return colis_dict(colis_de(db, organisation, colis_id))


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois du transporteur : dépôts, distributions, encaissé, par trajet."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    colis = db.scalars(
        select(Colis).where(Colis.organisation_id == organisation.id)
    ).all()
    du_mois = [un for un in colis if periode_de(un.date_depot) == periode]

    par_statut: dict[str, int] = {}
    for un in du_mois:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1

    par_trajet: dict[str, dict] = {}
    for un in du_mois:
        cle = f"{un.depart} → {un.arrivee}"
        if cle not in par_trajet:
            par_trajet[cle] = {"trajet": cle, "colis": 0, "frais": 0}
        par_trajet[cle]["colis"] += 1
        par_trajet[cle]["frais"] += un.frais

    par_genre: dict[str, int] = {}
    for un in du_mois:
        par_genre[un.genre] = par_genre.get(un.genre, 0) + 1

    return {
        "periode": periode,
        "colis": len(colis),
        "deposes": len(du_mois),
        "par_statut": par_statut,
        "par_trajet": sorted(par_trajet.values(), key=lambda un: -un["colis"]),
        "par_genre": sorted(
            ({"genre": cle, "colis": n} for cle, n in par_genre.items()),
            key=lambda un: -un["colis"],
        ),
        "frais_mois": sum(un.frais for un in du_mois if un.moyen != "a_payer"),
        "a_percevoir": sum(un.frais for un in du_mois if un.moyen == "a_payer"),
        "poids_mois": sum(un.poids_kg for un in du_mois),
    }



def demande_dict(demande: Demande) -> dict:
    """Une demande d'envoi, vue de l'agence."""
    return {
        "id": demande.id,
        "genre": demande.genre,
        "description": demande.description,
        "poids_kg": demande.poids_kg,
        "expediteur_nom": demande.expediteur_nom,
        "expediteur_telephone": demande.expediteur_telephone,
        "destinataire_nom": demande.destinataire_nom,
        "destinataire_telephone": demande.destinataire_telephone,
        "depart": demande.depart,
        "arrivee": demande.arrivee,
        "note": demande.note,
        "statut": demande.statut,
        "cree_le": demande.cree_le.isoformat(timespec="seconds"),
        "traite_le": demande.traite_le.isoformat(timespec="seconds") if demande.traite_le else None,
    }


def ajouter_demande(
    db: Session, organisation: Organisation, entree: DemandeEnvoiEntree
) -> Demande:
    """La demande d'envoi venue de la page publique."""
    demande = Demande(
        organisation_id=organisation.id,
        genre=entree.genre,
        description=entree.description.strip(),
        poids_kg=entree.poids_kg,
        expediteur_nom=entree.expediteur_nom.strip(),
        expediteur_telephone=entree.expediteur_telephone,
        destinataire_nom=entree.destinataire_nom.strip(),
        destinataire_telephone=entree.destinataire_telephone,
        depart=entree.depart,
        arrivee=entree.arrivee,
        note=entree.note.strip(),
    )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande


def liste_demandes(db: Session, organisation: Organisation, statut: str | None = None) -> list:
    requete = (
        select(Demande)
        .where(Demande.organisation_id == organisation.id)
        .order_by(Demande.id.desc())
    )
    if statut:
        requete = requete.where(Demande.statut == statut)
    return list(db.scalars(requete).all())


def demande_de(db: Session, organisation: Organisation, demande_id: int) -> Demande:
    demande = db.get(Demande, demande_id)
    if demande is None or demande.organisation_id != organisation.id:
        raise refus("demande_inconnue", 404)
    return demande


def corriger_demande(db: Session, organisation: Organisation, demande_id: int, statut: str) -> Demande:
    if statut not in ("demande", "acceptee", "refusee"):
        raise refus("saisie", statut="demande, acceptee ou refusee")
    demande = demande_de(db, organisation, demande_id)
    demande.statut = statut
    from ..utils import maintenant

    demande.traite_le = maintenant() if statut != "demande" else None
    db.commit()
    db.refresh(demande)
    return demande
