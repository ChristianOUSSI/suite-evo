from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, GroupeCourant
from ..messages import refus
from ..models import Tour
from ..schemas import CotisationEntree, RemiseEntree, TirageEntree, TourEntree
from ..services import present, tontine

router = APIRouter(tags=["tours"])

GESTION = ("responsable", "tresorier")


def _droit_gestion(compte) -> None:
    if compte.role not in GESTION:
        raise refus("droits", 403)


@router.get("/tours")
def liste(groupe: GroupeCourant, db: DbSession, limite: int = 24) -> dict:
    lignes = db.scalars(
        select(Tour)
        .where(Tour.groupe_id == groupe.id)
        .order_by(Tour.numero.desc())
        .limit(max(1, min(limite, 200)))
    ).all()
    rendus = [present.tour_dict(un) for un in lignes]
    return {
        "total": len(rendus),
        "remis": sum(1 for un in lignes if un.remise is not None),
        "tours": rendus,
    }


@router.get("/tours/{tour_id}")
def fiche(tour_id: int, groupe: GroupeCourant, db: DbSession) -> dict:
    tour = tontine.tour_du_cercle(db, groupe, tour_id)
    return present.tour_detail(tour)


@router.post("/tours")
def ouvrir(
    entree: TourEntree,
    groupe: GroupeCourant,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Un tour nouveau porte une cotisation due pour chaque membre actif."""
    _droit_gestion(compte)
    tour = tontine.ouvrir_tour(db, groupe, entree.date_prevue)
    return present.tour_detail(tour)


@router.get("/tours/{tour_id}/tirage")
def lecture_tirage(tour_id: int, groupe: GroupeCourant, db: DbSession) -> dict:
    """Le tirage d'un tour, avec le calcul refait devant le membre.

    Sans cette lecture, la preuve n'existerait qu'à la seconde du tirage : au
    rafraîchissement de l'écran, le gagnant serait une affirmation comme une
    autre. La graine et le rang se revérifient donc à tout moment.
    """
    tour = tontine.tour_du_cercle(db, groupe, tour_id)
    return _tirage_dict(tour, tontine.membres_actifs(db, groupe.id))


@router.post("/tours/{tour_id}/tirer")
def tirer(
    tour_id: int,
    entree: TirageEntree,
    groupe: GroupeCourant,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Le tirage est revérifiable : la graine est rendue avec le nom."""
    _droit_gestion(compte)
    tour = tontine.tirer(db, groupe, tour_id, entree.graine)
    return _tirage_dict(tour, tontine.membres_actifs(db, groupe.id))


@router.post("/tours/{tour_id}/cotiser")
def cotiser(
    tour_id: int,
    entree: CotisationEntree,
    groupe: GroupeCourant,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """La part d'un membre rentre, en espèces ou sur un des deux rails."""
    _droit_gestion(compte)
    tour = tontine.tour_du_cercle(db, groupe, tour_id)
    if tour.statut == "remis":
        raise refus("deja_remis")
    cotisation = tontine.payer_cotisation(
        db, groupe, tour.id, entree.membre_id, entree.montant, entree.mode, entree.jour
    )
    return {
        "cotisation": present.membre_dict(cotisation.membre, cotisation),
        "tour": present.tour_dict(tour),
    }


@router.post("/tours/{tour_id}/remettre")
def remettre(
    tour_id: int,
    entree: RemiseEntree,
    groupe: GroupeCourant,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    _droit_gestion(compte)
    remise = tontine.remettre(db, groupe, tour_id, entree.temoin, entree.mode, entree.note)
    return present.remise_dict(remise)


@router.post("/tours/clore")
def clore(groupe: GroupeCourant, compte: CompteCourant, db: DbSession) -> dict:
    _droit_gestion(compte)
    tour = tontine.cloturer_tour(db, groupe)
    return present.tour_detail(tour)


def _tirage_dict(tour: Tour, membres: list) -> dict:
    """Le tour, sa taille et le calcul refait. Un tour non tiré n'a pas de preuve."""
    return {
        **present.tour_dict(tour),
        "taille": len(membres),
        "verifier": _empreinte(tour.graine, len(membres), membres)
        if tour.gagnant_id is not None and len(membres) > 0
        else None,
    }


def _empreinte(graine: str, taille: int, membres: list) -> dict:
    """Le calcul refait devant le membre, pour qu'il puisse le répéter.

    La phrase qui explique l'algorithme n'est pas ici : c'est un mot d'écran, et
    un mot d'écran fabriqué côté serveur est une langue imposée.
    """
    index = tontine.index_tire(graine, taille)
    return {
        "graine": graine,
        "index": index,
        "nom": membres[index].nom if 0 <= index < len(membres) else None,
    }
