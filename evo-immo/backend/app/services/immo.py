from __future__ import annotations

"""Le registre de l'agence : les biens, les demandes, les visites.

Trois règles :

1. Le statut du bien se change à la main et se lit partout : disponible,
   en négociation, loué, vendu, retiré. Les compteurs se recalculent à la
   lecture - aucune colonne à désynchroniser.
2. Une demande garde son canal : téléphone, WhatsApp, panneau, bouche à
   oreille. C'est le canal qui dit où l'agence doit être présente.
3. Une visite a une issue : à venir, conclue, absente, refusée. Le passé
   ne se réécrit pas - on ajoute une ligne, on ne corrige pas l'histoire.
"""

import re
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Bien, Demande, Organisation, User, Visite
from ..schemas import DemandeEntree, VisiteEntree
from ..utils import aujourdhui, periode_de


def bien_de(db: Session, organisation: Organisation, bien_id: int) -> Bien:
    bien = db.get(Bien, bien_id)
    if bien is None or bien.organisation_id != organisation.id:
        raise refus("bien_inconnu", 404)
    return bien


def demande_de(db: Session, organisation: Organisation, demande_id: int) -> Demande:
    demande = db.get(Demande, demande_id)
    if demande is None or demande.organisation_id != organisation.id:
        raise refus("demande_inconnue", 404)
    return demande


def visite_de(db: Session, organisation: Organisation, visite_id: int) -> Visite:
    visite = db.get(Visite, visite_id)
    if visite is None or visite.organisation_id != organisation.id:
        raise refus("visite_inconnue", 404)
    return visite


def _verifier_date(jour: date) -> None:
    if jour > aujourdhui():
        # Une visite peut être demain ; une demande non. Le service décide.
        pass


def enregistrer_demande(
    db: Session, organisation: Organisation, entree: DemandeEntree, compte: User
) -> Demande:
    """Une demande : le client, son canal, le bien s'il est nommé."""
    if entree.bien_id is not None:
        bien = bien_de(db, organisation, entree.bien_id)
        if bien.statut == "retire":
            raise refus("bien_inconnu", 404)
    jour = entree.date or aujourdhui()
    if jour > aujourdhui():
        raise refus("saisie", date="le jour")

    demande = Demande(
        organisation_id=organisation.id,
        bien_id=entree.bien_id,
        client_nom=entree.client_nom.strip(),
        client_telephone=entree.client_telephone,
        canal=entree.canal,
        message=entree.message.strip(),
        statut=entree.statut,
        date=jour,
        cree_par=compte.id,
    )
    db.add(demande)
    db.commit()
    db.refresh(demande)
    return demande


def corriger_demande(
    db: Session,
    organisation: Organisation,
    demande_id: int,
    patch: dict,
) -> Demande:
    demande = demande_de(db, organisation, demande_id)
    if "bien_id" in patch and patch["bien_id"] is not None:
        bien_de(db, organisation, patch["bien_id"])
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(demande, cle, valeur)
    db.commit()
    db.refresh(demande)
    return demande


def planifier_visite(
    db: Session, organisation: Organisation, entree: VisiteEntree, compte: User
) -> Visite:
    """Une visite : le bien, le jour, l'heure, le client."""
    bien = bien_de(db, organisation, entree.bien_id)
    if bien.statut == "retire":
        raise refus("bien_inconnu", 404)

    visite = Visite(
        organisation_id=organisation.id,
        bien_id=bien.id,
        date=entree.date or aujourdhui(),
        heure=entree.heure,
        client_nom=entree.client_nom.strip(),
        client_telephone=entree.client_telephone,
        issue=entree.issue,
        note=entree.note.strip(),
        cree_par=compte.id,
    )
    db.add(visite)
    db.commit()
    db.refresh(visite)
    return visite


def corriger_visite(
    db: Session, organisation: Organisation, visite_id: int, patch: dict
) -> Visite:
    visite = visite_de(db, organisation, visite_id)
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(visite, cle, valeur)
    db.commit()
    db.refresh(visite)
    return visite


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de l'agence : les biens, les demandes neuves, les visites."""
    ce_mois = periode_de(aujourdhui())
    biens = db.scalars(
        select(Bien).where(Bien.organisation_id == organisation.id)
    ).all()
    demandes = db.scalars(
        select(Demande).where(Demande.organisation_id == organisation.id)
    ).all()
    visites = db.scalars(
        select(Visite).where(Visite.organisation_id == organisation.id)
    ).all()
    aujourdhui_d = aujourdhui()
    return {
        "jour": aujourdhui_d.isoformat(),
        "periode": ce_mois,
        "biens": len(biens),
        "disponibles": sum(1 for un in biens if un.statut == "disponible"),
        "negociations": sum(1 for un in biens if un.statut == "negociation"),
        "vendus_loues": sum(1 for un in biens if un.statut in ("vendu", "loue")),
        "demandes_neuves": sum(1 for un in demandes if un.statut == "nouvelle"),
        "visites_aujourdhui": sum(1 for un in visites if un.date == aujourdhui_d),
        "visites_mois": sum(1 for un in visites if periode_de(un.date) == ce_mois),
        "demandes_mois": sum(1 for un in demandes if periode_de(un.date) == ce_mois),
        "ventes_mois": sum(un.prix for un in biens if un.statut in ("vendu", "loue")),
    }


def liste_biens(
    db: Session,
    organisation: Organisation,
    statut: str | None = None,
    type_bien: str | None = None,
    quartier: str | None = None,
    seulement_disponibles: bool = False,
) -> list[dict]:
    from .present import bien_dict

    requete = (
        select(Bien)
        .where(Bien.organisation_id == organisation.id)
        .order_by(Bien.prix)
    )
    biens = list(db.scalars(requete).all())
    if statut:
        biens = [un for un in biens if un.statut == statut]
    if type_bien:
        biens = [un for un in biens if un.type == type_bien]
    if quartier:
        biens = [un for un in biens if un.quartier == quartier]
    if seulement_disponibles:
        biens = [un for un in biens if un.statut == "disponible"]
    return [bien_dict(un) for un in biens]


def fiche_bien(db: Session, organisation: Organisation, bien_id: int) -> dict:
    from .present import bien_dict

    return bien_dict(bien_de(db, organisation, bien_id), detail=True)


def liste_demandes(
    db: Session,
    organisation: Organisation,
    bien_id: int | None = None,
    statut: str | None = None,
    periode: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import demande_dict

    requete = (
        select(Demande)
        .where(Demande.organisation_id == organisation.id)
        .order_by(Demande.date.desc(), Demande.id.desc())
        .limit(limite)
    )
    if bien_id is not None:
        requete = requete.where(Demande.bien_id == bien_id)
    demandes = list(db.scalars(requete).all())
    if statut:
        demandes = [un for un in demandes if un.statut == statut]
    if periode:
        demandes = [un for un in demandes if periode_de(un.date) == periode]
    return [demande_dict(un) for un in demandes]


def liste_visites(
    db: Session,
    organisation: Organisation,
    bien_id: int | None = None,
    periode: str | None = None,
    jour: date | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import visite_dict

    requete = (
        select(Visite)
        .where(Visite.organisation_id == organisation.id)
        .order_by(Visite.date, Visite.heure)
        .limit(limite)
    )
    if bien_id is not None:
        requete = requete.where(Visite.bien_id == bien_id)
    visites = list(db.scalars(requete).all())
    if periode:
        visites = [un for un in visites if periode_de(un.date) == periode]
    if jour is not None:
        visites = [un for un in visites if un.date == jour]
    return [visite_dict(un) for un in visites]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de l'agence : visites, demandes, ce qui s'est vendu."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    biens = db.scalars(
        select(Bien).where(Bien.organisation_id == organisation.id)
    ).all()
    demandes = db.scalars(
        select(Demande).where(Demande.organisation_id == organisation.id)
    ).all()
    visites = db.scalars(
        select(Visite).where(Visite.organisation_id == organisation.id)
    ).all()

    visites_mois = [un for un in visites if periode_de(un.date) == periode]
    demandes_mois = [un for un in demandes if periode_de(un.date) == periode]
    vendus = [un for un in biens if un.statut in ("vendu", "loue")]

    par_issue: dict[str, int] = {}
    for un in visites_mois:
        par_issue[un.issue] = par_issue.get(un.issue, 0) + 1

    par_type: dict[str, dict] = {}
    for un in biens:
        if un.statut in ("disponible", "negociation"):
            cle = un.type
            if cle not in par_type:
                par_type[cle] = {"type": cle, "biens": 0, "valeur": 0}
            par_type[cle]["biens"] += 1
            par_type[cle]["valeur"] += un.prix

    par_quartier: dict[str, int] = {}
    for un in demandes_mois:
        if un.bien is not None:
            cle = un.bien.quartier or un.bien.ville
            par_quartier[cle] = par_quartier.get(cle, 0) + 1

    return {
        "periode": periode,
        "biens": len(biens),
        "disponibles": sum(1 for un in biens if un.statut == "disponible"),
        "visites": len(visites_mois),
        "demandes": len(demandes_mois),
        "par_issue": par_issue,
        "par_type": sorted(par_type.values(), key=lambda un: -un["valeur"]),
        "par_quartier": sorted(
            ({"quartier": cle, "demandes": n} for cle, n in par_quartier.items()),
            key=lambda un: -un["demandes"],
        ),
        "ventes_total": sum(un.prix for un in vendus),
        "ventes_mois": sum(
            un.prix
            for un in vendus
            if un.cree_le and periode_de(un.cree_le.date()) == periode
        ),
    }


def annonces_publiques(db: Session, organisation: Organisation) -> list[dict]:
    """La page publique : les biens disponibles, rien d'autre."""
    from .present import annonce_dict

    biens = db.scalars(
        select(Bien)
        .where(
            Bien.organisation_id == organisation.id,
            Bien.statut == "disponible",
        )
        .order_by(Bien.prix)
    ).all()
    return [annonce_dict(un) for un in biens]
