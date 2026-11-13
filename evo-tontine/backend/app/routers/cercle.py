from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, GroupeCourant
from ..messages import refus
from ..models import Groupe, Membre, User
from ..schemas import CompteEntree, GroupeEntree, MembreCorrection, MembreEntree
from ..security import hash_password
from ..services import present, tontine

router = APIRouter(tags=["cercle"])

GESTION = ("responsable", "tresorier")


def _droit_gestion(compte: User) -> None:
    if compte.role not in GESTION:
        raise refus("droits", 403)


@router.get("/groupe")
def lecture(groupe: GroupeCourant) -> dict:
    return present.groupe_dict(groupe)


@router.put("/groupe")
def ecrire(entree: GroupeEntree, groupe: GroupeCourant, compte: CompteCourant, db: DbSession) -> dict:
    """Le rythme, la cotisation, la pénalité et les rails du cercle."""
    _droit_gestion(compte)
    groupe.nom = entree.nom.strip()
    groupe.ville = entree.ville.strip()
    groupe.quartier = entree.quartier.strip()
    groupe.frequence = entree.frequence
    groupe.jour_ancre = entree.jour_ancre
    groupe.cotisation = entree.cotisation
    groupe.penalite = entree.penalite
    groupe.telephone = entree.telephone
    groupe.mot_du_groupe = entree.mot_du_groupe.strip()
    groupe.momo_actif = entree.momo_actif
    groupe.orange_actif = entree.orange_actif
    groupe.especes_actifs = entree.especes_actifs
    db.commit()
    return present.groupe_dict(groupe)


@router.get("/comptes")
def comptes(groupe: GroupeCourant, db: DbSession) -> list[dict]:
    lignes = db.scalars(
        select(User).where(User.groupe_id == groupe.id).order_by(User.nom)
    ).all()
    return [present.compte_dict(un) for un in lignes]


@router.post("/comptes")
def ajouter_compte(
    entree: CompteEntree, groupe: GroupeCourant, compte: CompteCourant, db: DbSession
) -> dict:
    _droit_gestion(compte)
    email = entree.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise refus("adresse_prise")
    nouveau = User(
        groupe_id=groupe.id,
        nom=entree.nom.strip(),
        email=email,
        mot_de_passe=hash_password(entree.mot_de_passe),
        role=entree.role,
    )
    db.add(nouveau)
    db.commit()
    return present.compte_dict(nouveau)


@router.get("/membres")
def membres(groupe: GroupeCourant, db: DbSession, tour_id: int | None = None) -> dict:
    """Le cercle, avec la part due sur le tour choisi (le courant par défaut)."""
    lignes = db.scalars(
        select(Membre).where(Membre.groupe_id == groupe.id).order_by(Membre.nom)
    ).all()

    tour = None
    if tour_id is not None:
        tour = tontine.tour_du_cercle(db, groupe, tour_id)
    else:
        courant = tontine.dernier_tour(db, groupe.id)
        if courant is not None and courant.statut in ("en_cours", "tire"):
            tour = courant

    parts = {}
    if tour is not None:
        parts = {un.membre_id: un for un in tour.cotisations}

    rendus = [present.membre_dict(un, parts.get(un.id)) for un in lignes]
    actifs = [un for un in rendus if un["actif"]]
    return {
        "total": len(rendus),
        "actifs": len(actifs),
        "parts": sum(un["part"] for un in actifs),
        "pot": tontine.montant_pot(groupe, [un for un in lignes if un.actif]),
        "tour": present.tour_dict(tour),
        "membres": rendus,
    }


@router.post("/membres")
def ajouter_membre(
    entree: MembreEntree, groupe: GroupeCourant, compte: CompteCourant, db: DbSession
) -> dict:
    _droit_gestion(compte)
    nom = entree.nom.strip()
    if db.scalar(
        select(Membre.id).where(Membre.groupe_id == groupe.id, Membre.nom == nom)
    ):
        raise refus("meme_nom")
    membre = Membre(
        groupe_id=groupe.id,
        nom=nom,
        telephone=entree.telephone,
        part=entree.part,
        note=entree.note.strip(),
    )
    db.add(membre)
    db.commit()
    return present.membre_dict(membre)


@router.patch("/membres/{membre_id}")
def corriger_membre(
    membre_id: int,
    entree: MembreCorrection,
    groupe: GroupeCourant,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    _droit_gestion(compte)
    membre = db.get(Membre, membre_id)
    if membre is None or membre.groupe_id != groupe.id:
        raise refus("membre_inconnu", 404)

    if entree.nom is not None:
        membre.nom = entree.nom.strip()
    if entree.telephone is not None:
        membre.telephone = entree.telephone
    if entree.part is not None:
        membre.part = entree.part
    if entree.actif is not None:
        membre.actif = entree.actif
    if entree.note is not None:
        membre.note = entree.note.strip()
    db.commit()
    return present.membre_dict(membre)


@router.get("/etat")
def etat(groupe: GroupeCourant, db: DbSession) -> dict:
    return tontine.etat_cercle(db, groupe)
