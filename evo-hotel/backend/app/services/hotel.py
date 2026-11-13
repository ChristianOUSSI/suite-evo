from __future__ import annotations

"""Le cahier des chambres : qui dort où, et ce que ça rapporte.

Trois règles :

1. Une chambre ne se loue pas deux fois au même soir. La vérification se fait
   à l'écriture, pas dans un index : deux séjours qui se touchent sans se
   chevaucher sont légaux, deux qui se recouvrent ne le sont pas.
2. Le statut se décide à l'écriture. « En cours » et « à venir » se déduisent
   des dates, pas d'un champ stocké que personne ne met à jour.
3. Le montant se calcule à la lecture : nuits × prix de la nuit, au tarif du
   jour de la chambre. Un prix corrigé change le devis, pas le passé.
"""

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Chambre, Client, Organisation, Sejour, User
from ..schemas import FORME_PERIODE
from ..utils import aujourdhui, bornes_de, periode_de

SEJOURS_VIVANTS = ("confirmee", "en_cours")


def chambre_de(db: Session, organisation: Organisation, chambre_id: int) -> Chambre:
    chambre = db.get(Chambre, chambre_id)
    if chambre is None or chambre.organisation_id != organisation.id:
        raise refus("chambre_inconnue", 404)
    return chambre


def client_de(db: Session, organisation: Organisation, client_id: int) -> Client:
    client = db.get(Client, client_id)
    if client is None or client.organisation_id != organisation.id:
        raise refus("client_inconnu", 404)
    return client


def sejour_de(db: Session, organisation: Organisation, sejour_id: int) -> Sejour:
    sejour = db.get(Sejour, sejour_id)
    if sejour is None or sejour.organisation_id != organisation.id:
        raise refus("sejour_inconnu", 404)
    return sejour


def chevauche(
    arrivee: date, depart: date, autre_arrivee: date, autre_depart: date
) -> bool:
    """Deux séjours se marchent dessus si l'un commence avant que l'autre finisse."""
    return arrivee < autre_depart and autre_arrivee < depart


def sejours_de_la_chambre(
    db: Session, chambre_id: int, sauf_id: int | None = None
) -> list[Sejour]:
    requete = select(Sejour).where(
        Sejour.chambre_id == chambre_id,
        Sejour.statut.in_(SEJOURS_VIVANTS),
    )
    if sauf_id is not None:
        requete = requete.where(Sejour.id != sauf_id)
    return list(db.scalars(requete).all())


def _verifier_dates(arrivee: date, depart: date) -> None:
    if depart <= arrivee:
        raise refus("dates_invalides")


def _verifier_libre(
    db: Session, chambre_id: int, arrivee: date, depart: date, sauf_id: int | None = None
) -> None:
    for sejour in sejours_de_la_chambre(db, chambre_id, sauf_id):
        if chevauche(arrivee, depart, sejour.arrivee, sejour.depart):
            raise refus("chambre_occupee")


def trouver_ou_creer_client(
    db: Session, organisation: Organisation, entree, compte: User
) -> Client:
    """Un client connu revient par son numéro ; sinon une fiche naît."""
    if entree.client_id is not None:
        return client_de(db, organisation, entree.client_id)

    nom = (entree.client_nom or "").strip()
    if len(nom) < 2:
        raise refus("saisie", nom="le nom du client")

    if entree.client_telephone:
        connu = db.scalar(
            select(Client).where(
                Client.organisation_id == organisation.id,
                Client.telephone == entree.client_telephone,
            )
        )
        if connu is not None:
            return connu

    client = Client(
        organisation_id=organisation.id,
        nom=nom,
        telephone=entree.client_telephone,
        note=f"créé à la réception par {compte.nom}",
    )
    db.add(client)
    db.flush()
    return client


def reserver(
    db: Session, organisation: Organisation, entree, compte: User
) -> Sejour:
    chambre = chambre_de(db, organisation, entree.chambre_id)
    if not chambre.actif:
        raise refus("chambre_inconnue", 404)
    _verifier_dates(entree.arrivee, entree.depart)
    _verifier_libre(db, chambre.id, entree.arrivee, entree.depart)
    client = trouver_ou_creer_client(db, organisation, entree, compte)

    sejour = Sejour(
        organisation_id=organisation.id,
        chambre_id=chambre.id,
        client_id=client.id,
        arrivee=entree.arrivee,
        depart=entree.depart,
        statut="confirmee",
        note=entree.note.strip(),
        cree_par=compte.id,
    )
    db.add(sejour)
    db.commit()
    db.refresh(sejour)
    return sejour


def corriger_sejour(
    db: Session, organisation: Organisation, sejour_id: int, entree, compte: User
) -> Sejour:
    sejour = sejour_de(db, organisation, sejour_id)
    if sejour.statut == "terminee":
        raise refus("sejour_termine", 409)
    if sejour.statut == "annulee":
        raise refus("sejour_annule", 409)

    nouvelle_arrivee = entree.arrivee or sejour.arrivee
    nouveau_depart = entree.depart or sejour.depart
    if nouvelle_arrivee != sejour.arrivee or nouveau_depart != sejour.depart:
        _verifier_dates(nouvelle_arrivee, nouveau_depart)
        _verifier_libre(
            db, sejour.chambre_id, nouvelle_arrivee, nouveau_depart, sauf_id=sejour.id
        )
        sejour.arrivee = nouvelle_arrivee
        sejour.depart = nouveau_depart

    if entree.statut is not None:
        sejour.statut = entree.statut
    if entree.note is not None:
        sejour.note = entree.note.strip()
    db.commit()
    db.refresh(sejour)
    return sejour


def statut_effectif(sejour: Sejour, ce_jour: date | None = None) -> str:
    """Ce que la réception lit : le statut stocké, affiné par les dates.

    Une réservation confirmée dont le départ est passé sans clôture se lit
    « en_cours » tant que personne n'a fait le geste de libérer la chambre.
    """
    aujourdhui_d = ce_jour or aujourdhui()
    if sejour.statut == "confirmee" and sejour.arrivee <= aujourdhui_d < sejour.depart:
        return "en_cours"
    return sejour.statut


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de la réception : ce qui dort, ce qui arrive, ce qui part."""
    ce_jour = aujourdhui()
    chambres = [
        un
        for un in db.scalars(
            select(Chambre).where(Chambre.organisation_id == organisation.id)
        ).all()
        if un.actif
    ]
    sejours = list(
        db.scalars(
            select(Sejour).where(
                Sejour.organisation_id == organisation.id,
                Sejour.statut.in_(SEJOURS_VIVANTS),
            )
        ).all()
    )
    en_cours = [un for un in sejours if statut_effectif(un, ce_jour) == "en_cours"]
    occupees = {un.chambre_id for un in en_cours}
    return {
        "jour": ce_jour.isoformat(),
        "chambres": len(chambres),
        "occupees": len(occupees),
        "libres": max(0, len(chambres) - len(occupees)),
        "en_cours": len(en_cours),
        "arrivees_du_jour": sum(
            1
            for un in sejours
            if statut_effectif(un, ce_jour) != "en_cours" and un.arrivee == ce_jour
        ),
        "departs_du_jour": sum(
            1 for un in en_cours if un.depart == ce_jour
        )
        + sum(
            1
            for un in sejours
            if un.statut == "confirmee" and un.depart == ce_jour
        ),
        "a_venir": sum(
            1
            for un in sejours
            if un.arrivee > ce_jour
        ),
    }


def liste_sejours(
    db: Session,
    organisation: Organisation,
    du: date | None = None,
    au: date | None = None,
    statut: str | None = None,
) -> list[dict]:
    """Les séjours, du plus proche au plus lointain."""
    requete = (
        select(Sejour)
        .where(Sejour.organisation_id == organisation.id)
        .order_by(Sejour.arrivee, Sejour.id)
    )
    if du is not None:
        requete = requete.where(Sejour.depart >= du)
    if au is not None:
        requete = requete.where(Sejour.arrivee <= au)
    sejours = list(db.scalars(requete).all())
    ce_jour = aujourdhui()
    return [
        {**_sejour_dict(un), "statut_effectif": statut_effectif(un, ce_jour)}
        for un in sejours
        if statut is None or statut_effectif(un, ce_jour) == statut or un.statut == statut
    ]


def _sejour_dict(sejour: Sejour) -> dict:
    from .present import sejour_dict

    return sejour_dict(sejour)


def disponibilite(
    db: Session, organisation: Organisation, arrivee: date, depart: date
) -> list[dict]:
    """Les chambres libres sur une période : ce que la réception propose."""
    chambres = db.scalars(
        select(Chambre)
        .where(Chambre.organisation_id == organisation.id, Chambre.actif.is_(True))
        .order_by(Chambre.numero)
    ).all()
    libres = []
    for chambre in chambres:
        occupe = any(
            chevauche(arrivee, depart, un.arrivee, un.depart)
            for un in sejours_de_la_chambre(db, chambre.id)
        )
        if not occupe:
            libres.append(
                {
                    "id": chambre.id,
                    "numero": chambre.numero,
                    "type": chambre.type,
                    "prix_par_nuit": chambre.prix_par_nuit,
                    "capacite": chambre.capacite,
                    "nuits": (depart - arrivee).days,
                    "montant": (depart - arrivee).days * chambre.prix_par_nuit,
                }
            )
    return libres


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois de l'hôtel : nuits vendues, recette estimée, taux d'occupation."""
    if not FORME_PERIODE.match(periode or ""):
        raise refus("periode_inconnue")
    debut, fin = bornes_de(periode)
    chambres = [
        un
        for un in db.scalars(
            select(Chambre).where(Chambre.organisation_id == organisation.id)
        ).all()
        if un.actif
    ]
    sejours = list(
        db.scalars(
            select(Sejour).where(
                Sejour.organisation_id == organisation.id,
                Sejour.statut.in_(SEJOURS_VIVANTS + ("terminee",)),
            )
        ).all()
    )
    nuits_par_chambre = {un.id: 0 for un in chambres}
    montant = 0
    arrivees = 0
    for sejour in sejours:
        debut_nuit = max(sejour.arrivee, debut)
        fin_nuit = min(sejour.depart, fin + timedelta(days=1))
        nuits = max(0, (fin_nuit - debut_nuit).days)
        if nuits:
            nuits_par_chambre[sejour.chambre_id] = (
                nuits_par_chambre.get(sejour.chambre_id, 0) + nuits
            )
            montant += nuits * sejour.chambre.prix_par_nuit
            if sejour.arrivee >= debut and sejour.arrivee <= fin:
                arrivees += 1
    jours = (fin - debut).days + 1
    capacite = len(chambres) * jours
    nuits_vendues = sum(nuits_par_chambre.values())
    return {
        "periode": periode,
        "chambres": len(chambres),
        "jours": jours,
        "nuits_vendues": nuits_vendues,
        "capacite_nuits": capacite,
        "taux_occupation": round(100 * nuits_vendues / capacite, 1) if capacite else 0.0,
        "montant": montant,
        "arrivees": arrivees,
        "par_chambre": [
            {
                "chambre_id": un.id,
                "numero": un.numero,
                "type": un.type,
                "nuits": nuits_par_chambre.get(un.id, 0),
                "montant": nuits_par_chambre.get(un.id, 0) * un.prix_par_nuit,
            }
            for un in chambres
        ],
    }
