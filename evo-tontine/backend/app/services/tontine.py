from __future__ import annotations

# Le coeur du cercle : le pot, le tirage, la cotisation, la pénalité.
#
# Le tirage est vérifiable par tout le monde. Il ne sort pas d'une boîte noire :
# une graine publique (le nom du groupe, le numéro du tour, la date) donne un
# index dans la liste triée des membres. N'importe quel membre peut refaire le
# calcul avec son téléphone et tomber sur le même nom. C'est la seule façon de
# faire accepter un ordre de passage sans dispute.

import hashlib
from datetime import date

from sqlalchemy import select

from ..messages import refus
from ..models import Cotisation, Groupe, Membre, Remise, Tour
from ..security import jeton_public
from ..utils import tour_suivant
from . import present

MODES = {"especes", "momo_mtn", "momo_orange"}


def membres_actifs(db, groupe_id: int) -> list[Membre]:
    lignes = db.scalars(
        select(Membre).where(Membre.groupe_id == groupe_id, Membre.actif.is_(True))
    ).all()
    return sorted(lignes, key=lambda un: (un.nom, un.id))


def montant_pot(groupe: Groupe, membres: list[Membre]) -> int:
    return groupe.cotisation * sum(un.part for un in membres)


def dernier_tour(db, groupe_id: int) -> Tour | None:
    return db.scalar(
        select(Tour)
        .where(Tour.groupe_id == groupe_id)
        .order_by(Tour.numero.desc())
        .limit(1)
    )


def tour_du_cercle(db, groupe: Groupe, tour_id: int) -> Tour:
    tour = db.get(Tour, tour_id)
    if tour is None or tour.groupe_id != groupe.id:
        raise refus("tour_inconnu", 404)
    return tour


def ouvrir_tour(db, groupe: Groupe, date_prevue: date | None = None) -> Tour:
    """Le tour suivant est créé avec une cotisation due par membre actif."""
    membres = membres_actifs(db, groupe.id)
    if not membres:
        raise refus("sans_membre")

    precedent = dernier_tour(db, groupe.id)
    numero = 1 if precedent is None else precedent.numero + 1
    if date_prevue is None:
        if precedent is None:
            date_prevue = date.today()
        else:
            date_prevue = tour_suivant(
                precedent.date_prevue, groupe.frequence, groupe.jour_ancre
            )

    tour = Tour(
        groupe_id=groupe.id,
        numero=numero,
        date_prevue=date_prevue,
        montant_pot=montant_pot(groupe, membres),
        statut="en_cours",
    )
    db.add(tour)
    db.flush()

    for membre in membres:
        db.add(
            Cotisation(
                tour_id=tour.id,
                membre_id=membre.id,
                montant_attendu=groupe.cotisation * membre.part,
            )
        )
    db.commit()
    db.refresh(tour)
    return tour


def graine_du_tour(groupe: Groupe, tour: Tour, choisie: str = "") -> str:
    """La graine est publique : c'est ce qui rend le tirage revérifiable."""
    if choisie.strip():
        return choisie.strip()[:40]
    return f"{groupe.nom}|tour {tour.numero}|{tour.date_prevue.isoformat()}"


def index_tire(graine: str, taille: int) -> int:
    digest = hashlib.sha256(graine.encode("utf-8")).hexdigest()
    return int(digest, 16) % taille


def tirer(db, groupe: Groupe, tour_id: int, graine: str = "") -> Tour:
    tour = tour_du_cercle(db, groupe, tour_id)
    if tour.statut in ("tire", "remis"):
        raise refus("deja_tire")

    membres = membres_actifs(db, groupe.id)
    if len(membres) < 2:
        raise refus("deux_membres")

    tour.graine = graine_du_tour(groupe, tour, graine)
    tour.gagnant_id = membres[index_tire(tour.graine, len(membres))].id
    tour.date_tirage = date.today()
    tour.statut = "tire"
    db.commit()
    db.refresh(tour)
    return tour


def payer_cotisation(
    db,
    groupe: Groupe,
    tour_id: int,
    membre_id: int,
    montant: int | None,
    mode: str,
    jour: date | None,
) -> Cotisation:
    tour = tour_du_cercle(db, groupe, tour_id)

    cotisation = db.scalar(
        select(Cotisation).where(
            Cotisation.tour_id == tour.id, Cotisation.membre_id == membre_id
        )
    )
    if cotisation is None:
        raise refus("membre_absent", 404)
    if cotisation.montant_attendu > 0 and cotisation.montant_paye >= cotisation.montant_attendu:
        raise refus("part_deja_rentree")

    if mode not in MODES:
        raise refus("rail_inconnu")
    autorise = {
        "especes": groupe.especes_actifs,
        "momo_mtn": groupe.momo_actif,
        "momo_orange": groupe.orange_actif,
    }[mode]
    if not autorise:
        raise refus("rail_coupe")

    date_paiement = jour or date.today()
    du = cotisation.montant_attendu
    cotisation.montant_paye = (
        min(du, cotisation.montant_paye + montant)
        if montant is not None
        else du
    )
    cotisation.payee_le = date_paiement
    cotisation.mode = mode
    if not cotisation.reference:
        cotisation.reference = jeton_public(8)

    # La pénalité se décide à la date du tour et ne bouge plus.
    if date_paiement > tour.date_prevue:
        cotisation.penalite = groupe.penalite

    db.commit()
    db.refresh(cotisation)
    return cotisation


def remettre(db, groupe: Groupe, tour_id: int, temoin: str, mode: str, note: str) -> Remise:
    tour = tour_du_cercle(db, groupe, tour_id)
    if tour.statut != "tire" or tour.gagnant_id is None:
        raise refus("tirage_d_abord")
    if tour.remise is not None:
        raise refus("deja_remis")
    if mode not in MODES:
        raise refus("rail_inconnu")

    manquantes = [
        un for un in tour.cotisations if un.montant_paye < un.montant_attendu
    ]
    if manquantes:
        raise refus(
            "pot_incomplet",
            vars={"manquantes": len(manquantes)},
            fr=(
                "Le pot n'est pas complet : il manque "
                f"{len(manquantes)} part{'' if len(manquantes) == 1 else 's'}."
            ),
            en=(
                "The pool is not complete: "
                f"{len(manquantes)} share{'' if len(manquantes) == 1 else 's'} missing."
            ),
        )

    rentre = sum(un.montant_paye for un in tour.cotisations)
    remise = Remise(
        tour_id=tour.id,
        groupe_id=groupe.id,
        membre_id=tour.gagnant_id,
        montant=rentre,
        jeton=jeton_public(),
        temoin=temoin.strip(),
        mode=mode,
        note=note.strip(),
    )
    tour.statut = "remis"
    db.add(remise)
    db.commit()
    db.refresh(remise)
    return remise


def cloturer_tour(db, groupe: Groupe) -> Tour:
    """Le pot est remis : on ouvre le tour suivant."""
    precedent = dernier_tour(db, groupe.id)
    if precedent is None:
        raise refus("aucun_tour")
    if precedent.statut == "en_cours":
        raise refus("pot_non_tire")
    if precedent.remise is None:
        raise refus("pot_non_remis")
    return ouvrir_tour(db, groupe)


def etat_cercle(db, groupe: Groupe) -> dict:
    """La vitre du trésorier : ce qui est dû, rentré, en retard, qui reçoit."""
    today = date.today()
    tours = db.scalars(
        select(Tour).where(Tour.groupe_id == groupe.id).order_by(Tour.numero.desc())
    ).all()
    membres = membres_actifs(db, groupe.id)

    courant = next(
        (un for un in tours if un.statut in ("en_cours", "tire")), None
    )
    # Le dernier tour, remis ou non : la caisse doit pouvoir montrer le reçu
    # qui vient d'être écrit, à la seconde où le tour n'est plus « en cours ».
    dernier = tours[0] if tours else None

    du = rentre = pen = 0
    en_retard: list[str] = []
    if courant is not None:
        for cotisation in courant.cotisations:
            du += cotisation.montant_attendu
            rentre += cotisation.montant_paye
            pen += cotisation.penalite
            if cotisation.montant_paye < cotisation.montant_attendu:
                en_retard.append(cotisation.membre.nom)

    prochain = None
    if membres:
        base = courant if courant is not None else None
        date_prochaine = (
            tour_suivant(base.date_prevue, groupe.frequence, groupe.jour_ancre)
            if base is not None
            else today
        )
        prochain = {
            "numero": (courant.numero + 1 if courant else 1),
            "date_prevue": date_prochaine.isoformat(),
            "montant_pot": montant_pot(groupe, membres),
            "statut": "a_venir",
        }

    return {
        "groupe_id": groupe.id,
        "jour": today.isoformat(),
        "membres": len(membres),
        "tours": len(tours),
        "pot_attendu": du,
        "pot_rentre": rentre,
        "pot_restant": max(0, du - rentre),
        "penalites": pen,
        "en_retard": sorted(en_retard),
        "total_remis": sum(un.remise.montant for un in tours if un.remise is not None),
        "tour_courant": present.tour_dict(courant) if courant else None,
        "dernier": _dernier(dernier),
        "prochain": prochain,
    }


def _dernier(tour: Tour | None) -> dict | None:
    if tour is None:
        return None
    return {
        **present.tour_dict(tour),
        "remise": present.remise_dict(tour.remise) if tour.remise else None,
    }
