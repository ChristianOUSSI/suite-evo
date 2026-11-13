from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CompteCourant, DbSession, EntrepriseCourante
from ..messages import refus
from ..models import User
from ..schemas import ClientEntree, CompteEntree, EntrepriseEntree
from ..security import hash_password
from ..services import carnet, present

router = APIRouter(tags=["carnet"])


@router.get("/entreprise")
def lecture(entreprise: EntrepriseCourante) -> dict:
    return present.entreprise_dict(entreprise)


@router.put("/entreprise")
def ecrire(
    entree: EntrepriseEntree,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Le nom de la maison, sa ville et le délai de silence qui fâche."""
    if compte.role != "responsable":
        raise refus("droits", 403)
    entreprise.nom = entree.nom.strip()
    entreprise.ville = entree.ville.strip()
    entreprise.quartier = entree.quartier.strip()
    entreprise.secteur = entree.secteur.strip()
    entreprise.telephone = entree.telephone
    entreprise.silence_jours = entree.silence_jours
    entreprise.rappel_jours = entree.rappel_jours
    db.commit()
    return present.entreprise_dict(entreprise)


@router.get("/comptes")
def comptes(entreprise: EntrepriseCourante, db: DbSession) -> list[dict]:
    lignes = db.scalars(
        select(User).where(User.entreprise_id == entreprise.id).order_by(User.nom)
    ).all()
    return [present.compte_dict(un) for un in lignes]


@router.post("/comptes")
def ajouter_compte(
    entree: CompteEntree,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    if compte.role != "responsable":
        raise refus("droits", 403)
    email = entree.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise refus("adresse_prise")
    nouveau = User(
        entreprise_id=entreprise.id,
        nom=entree.nom.strip(),
        email=email,
        mot_de_passe=hash_password(entree.mot_de_passe),
        role=entree.role,
    )
    db.add(nouveau)
    db.commit()
    return present.compte_dict(nouveau)


@router.get("/clients")
def liste(
    entreprise: EntrepriseCourante,
    db: DbSession,
    texte: str = "",
    segment: str = "",
) -> dict:
    lignes = carnet.rechercher(db, entreprise, texte, segment)
    return {
        "total": len(lignes),
        "actifs": sum(1 for un in lignes if un.actif),
        "clients": [
            present.client_dict(un) for un in sorted(lignes, key=lambda un: un.nom)
        ],
    }


@router.post("/clients")
def ajouter(
    entree: ClientEntree,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    return present.client_dict(carnet.ajouter_client(db, entreprise, entree))


@router.get("/etat")
def etat(entreprise: EntrepriseCourante, db: DbSession) -> dict:
    return carnet.etat(db, entreprise)
