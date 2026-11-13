from __future__ import annotations

"""Le registre de la boutique : les annonces et les commandes.

Trois règles :

1. Une annonce a un prix et un stock. Passer à « vendu » ou « retiré » la
   sort de la page publique sans l'effacer : l'historique reste lisible.
2. Une commande fige le montant au moment de la vente (prix × quantité) :
   si le prix change ensuite, la commande garde le sien.
3. Le stock ne descend que quand la commande est confirmée ; l'annuler la
   rend. Rien ne s'efface — on change de statut.
"""

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Annonce, Commande, Organisation, User
from ..schemas import AnnonceEntree, CommandeEntree
from ..utils import aujourdhui, periode_de


def annonce_de(db: Session, organisation: Organisation, annonce_id: int) -> Annonce:
    annonce = db.get(Annonce, annonce_id)
    if annonce is None or annonce.organisation_id != organisation.id:
        raise refus("annonce_inconnue", 404)
    return annonce


def commande_de(db: Session, organisation: Organisation, commande_id: int) -> Commande:
    commande = db.get(Commande, commande_id)
    if commande is None or commande.organisation_id != organisation.id:
        raise refus("commande_inconnue", 404)
    return commande


def _verifier_futur(jour, champ: str) -> None:
    if jour and jour > aujourdhui():
        raise refus("saisie", **{champ: "le jour"})


def enregistrer_commande(
    db: Session, organisation: Organisation, entree: CommandeEntree, compte: User
) -> Commande:
    """Une commande : l'annonce, la quantité, l'acheteur, le moyen."""
    annonce = annonce_de(db, organisation, entree.annonce_id)
    if annonce.statut != "en_ligne":
        raise refus("annonce_inconnue", 404)
    if annonce.stock <= 0:
        raise refus("rupture", 409)
    if entree.quantite > annonce.stock:
        raise refus("rupture", 409)
    jour = entree.date or aujourdhui()
    _verifier_futur(jour, "date")

    commande = Commande(
        organisation_id=organisation.id,
        annonce_id=annonce.id,
        quantite=entree.quantite,
        montant=annonce.prix * entree.quantite,
        acheteur_nom=entree.acheteur_nom.strip(),
        acheteur_telephone=entree.acheteur_telephone,
        moyen=entree.moyen,
        statut="nouvelle",
        date=jour,
        note=entree.note.strip(),
        cree_par=compte.id,
    )
    db.add(commande)
    db.commit()
    db.refresh(commande)
    return commande


def corriger_commande(
    db: Session, organisation: Organisation, commande_id: int, patch: dict
) -> Commande:
    """Le statut de la commande pilote le stock de l'annonce."""
    commande = commande_de(db, organisation, commande_id)
    statut = patch.get("statut")
    if statut is not None:
        avant = commande.statut
        # Le stock bouge quand on entre ou qu'on sort de « confirmee ».
        if statut == "confirmee" and avant != "confirmee":
            if commande.annonce.stock < commande.quantite:
                raise refus("rupture", 409)
            commande.annonce.stock -= commande.quantite
        elif avant == "confirmee" and statut != "confirmee":
            commande.annonce.stock += commande.quantite
        if statut == "livree":
            patch["date"] = aujourdhui()
    for cle, valeur in patch.items():
        if valeur is not None:
            setattr(commande, cle, valeur)
    db.commit()
    db.refresh(commande)
    return commande


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de la boutique : annonces, commandes, ventes du mois."""
    ce_mois = periode_de(aujourdhui())
    annonces = db.scalars(
        select(Annonce).where(Annonce.organisation_id == organisation.id)
    ).all()
    commandes = db.scalars(
        select(Commande).where(Commande.organisation_id == organisation.id)
    ).all()
    en_ligne = [un for un in annonces if un.statut == "en_ligne"]
    du_mois = [un for un in commandes if periode_de(un.date) == ce_mois]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": ce_mois,
        "annonces": len(annonces),
        "en_ligne": len(en_ligne),
        "ruptures": sum(1 for un in en_ligne if un.stock <= 0),
        "commandes_neuves": sum(1 for un in commandes if un.statut == "nouvelle"),
        "commandes_mois": len(du_mois),
        "ventes_mois": sum(un.montant for un in du_mois if un.statut != "annulee"),
        "ventes_total": sum(un.montant for un in commandes if un.statut != "annulee"),
        "stock_total": sum(un.stock for un in en_ligne),
    }


def liste_annonces(
    db: Session,
    organisation: Organisation,
    categorie: str | None = None,
    statut: str | None = None,
    recherche: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import annonce_dict

    requete = (
        select(Annonce)
        .where(Annonce.organisation_id == organisation.id)
        .order_by(Annonce.prix)
        .limit(limite)
    )
    annonces = list(db.scalars(requete).all())
    if categorie:
        annonces = [un for un in annonces if un.categorie == categorie]
    if statut:
        annonces = [un for un in annonces if un.statut == statut]
    if recherche:
        motif = recherche.strip().lower()
        annonces = [
            un
            for un in annonces
            if motif in un.titre.lower()
            or motif in un.description.lower()
            or motif in un.quartier.lower()
        ]
    return [annonce_dict(un) for un in annonces]


def fiche_annonce(db: Session, organisation: Organisation, annonce_id: int) -> dict:
    from .present import annonce_dict

    return annonce_dict(annonce_de(db, organisation, annonce_id), detail=True)


def liste_commandes(
    db: Session,
    organisation: Organisation,
    annonce_id: int | None = None,
    statut: str | None = None,
    periode: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import commande_dict

    requete = (
        select(Commande)
        .where(Commande.organisation_id == organisation.id)
        .order_by(Commande.date.desc(), Commande.id.desc())
        .limit(limite)
    )
    if annonce_id is not None:
        requete = requete.where(Commande.annonce_id == annonce_id)
    commandes = list(db.scalars(requete).all())
    if statut:
        commandes = [un for un in commandes if un.statut == statut]
    if periode:
        commandes = [un for un in commandes if periode_de(un.date) == periode]
    return [commande_dict(un) for un in commandes]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de la boutique : ventes, commandes, par catégorie."""
    if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    commandes = db.scalars(
        select(Commande).where(Commande.organisation_id == organisation.id)
    ).all()
    annonces = db.scalars(
        select(Annonce).where(Annonce.organisation_id == organisation.id)
    ).all()
    du_mois = [un for un in commandes if periode_de(un.date) == periode]
    valides = [un for un in du_mois if un.statut != "annulee"]

    par_statut: dict[str, int] = {}
    for un in du_mois:
        par_statut[un.statut] = par_statut.get(un.statut, 0) + 1

    par_categorie: dict[str, dict] = {}
    for un in valides:
        cle = un.annonce.categorie if un.annonce else "autre"
        if cle not in par_categorie:
            par_categorie[cle] = {"categorie": cle, "ventes": 0, "montant": 0}
        par_categorie[cle]["ventes"] += un.quantite
        par_categorie[cle]["montant"] += un.montant

    return {
        "periode": periode,
        "annonces": len(annonces),
        "en_ligne": sum(1 for un in annonces if un.statut == "en_ligne"),
        "commandes": len(du_mois),
        "par_statut": par_statut,
        "par_categorie": sorted(par_categorie.values(), key=lambda un: -un["montant"]),
        "ventes_mois": sum(un.montant for un in valides),
        "ventes_total": sum(un.montant for un in commandes if un.statut != "annulee"),
        "quantites_mois": sum(un.quantite for un in valides),
    }


def annonces_publiques(db: Session, organisation: Organisation) -> list[dict]:
    """La page publique : les annonces en ligne avec du stock, rien d'autre."""
    from .present import annonce_publique_dict

    annonces = db.scalars(
        select(Annonce)
        .where(
            Annonce.organisation_id == organisation.id,
            Annonce.statut == "en_ligne",
            Annonce.stock > 0,
        )
        .order_by(Annonce.prix)
    ).all()
    return [annonce_publique_dict(un) for un in annonces]
