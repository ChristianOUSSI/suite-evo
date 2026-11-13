from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select

from ..deps import CurrentEcole, DbSession
from ..models import Classe, Echeance, Eleve, Engagement, Paiement, Recu, User
from ..schemas import EcoleIn, MembreIn
from ..security import hash_password
from ..services import facturation, present
from ..utils import maintenant

router = APIRouter(tags=["réglages"])


@router.get("/settings")
def lecture(ecole: CurrentEcole, db: DbSession) -> dict:
    membres = db.scalars(
        select(User).where(User.ecole_id == ecole.id).order_by(User.created_at)
    ).all()
    annee = present.annee_courante(ecole)
    classes = db.scalars(
        select(Classe)
        .where(Classe.ecole_id == ecole.id, Classe.annee == annee)
        .order_by(Classe.niveau)
    ).all()
    eleves = db.scalar(
        select(func.count(Eleve.id)).where(Eleve.ecole_id == ecole.id)
    )
    recus = db.scalar(select(func.count(Recu.id)).where(Recu.ecole_id == ecole.id))
    attendus = db.scalar(
        select(func.sum(Echeance.montant)).where(Echeance.ecole_id == ecole.id)
    )
    rentres = db.scalar(
        select(func.sum(Echeance.impute)).where(Echeance.ecole_id == ecole.id)
    )
    return {
        "ecole": present.ecole_dict(ecole),
        "membres": [present.user_dict(membre) for membre in membres],
        "classes": [present.classe_dict(classe, ecole) for classe in classes],
        "compteurs": {
            "eleves": eleves or 0,
            "recus": recus or 0,
            "attendu": attendus or 0,
            "rentre": rentres or 0,
        },
        "demo": True,
        "devise": "FCFA",
    }


@router.put("/settings")
def ecrire(entree: EcoleIn, ecole: CurrentEcole, db: DbSession) -> dict:
    """Les mots de l'école, ses rails et son calendrier de relance."""
    if entree.relance_avance >= entree.tolerance_retard:
        raise HTTPException(
            status_code=422,
            detail=(
                "Le rappel avant échéance doit tomber avant le premier avis "
                "de retard."
            ),
        )
    ecole.nom = entree.nom.strip()
    ecole.sigle = entree.sigle.strip()
    ecole.genre = entree.genre
    ecole.ville = entree.ville.strip()
    ecole.quartier = entree.quartier.strip()
    ecole.direction = entree.direction.strip()
    ecole.comptable = entree.comptable.strip()
    ecole.telephone = entree.telephone
    ecole.date_rentree = entree.date_rentree
    ecole.fin_annee = entree.fin_annee
    ecole.relance_avance = entree.relance_avance
    ecole.tolerance_retard = entree.tolerance_retard
    ecole.ton = entree.ton
    ecole.mention_recu = entree.mention_recu.strip()
    ecole.whatsapp_actif = entree.whatsapp_actif
    ecole.sms_actif = entree.sms_actif
    ecole.especes_actifs = entree.especes_actifs
    ecole.momo_actif = entree.momo_actif
    ecole.orange_actif = entree.orange_actif
    db.commit()
    return present.ecole_dict(ecole)


@router.get("/team")
def equipe(ecole: CurrentEcole, db: DbSession) -> list[dict]:
    membres = db.scalars(
        select(User).where(User.ecole_id == ecole.id).order_by(User.nom)
    ).all()
    return [present.user_dict(membre) for membre in membres]


@router.post("/team")
def ajouter(entree: MembreIn, ecole: CurrentEcole, db: DbSession) -> dict:
    email = entree.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise HTTPException(
            status_code=422, detail="Cette adresse tient déjà une caisse."
        )
    membre = User(
        ecole_id=ecole.id,
        nom=entree.nom.strip(),
        email=email,
        mot_de_passe=hash_password(entree.mot_de_passe),
        role=entree.role,
        created_at=maintenant(),
    )
    db.add(membre)
    db.commit()
    return present.user_dict(membre)


@router.get("/recapitulatif")
def recapitulatif(ecole: CurrentEcole, db: DbSession) -> dict:
    """Une phrase pour la réunion des parents : où en est l'année."""
    annee = present.annee_courante(ecole)
    lignes = db.scalars(
        select(Engagement).where(
            Engagement.ecole_id == ecole.id, Engagement.annee == annee
        )
    ).all()
    du = sum(facturation.total_annuel(engagement) for engagement in lignes)
    rentre = sum(
        sum(ligne.impute for ligne in engagement.echeances)
        for engagement in lignes
    )
    payeurs = db.scalar(
        select(func.count(func.distinct(Paiement.eleve_id))).where(
            Paiement.ecole_id == ecole.id, Paiement.annule.is_(False)
        )
    )
    return {
        "annee": annee,
        "familles": len(lignes),
        "attendu": du,
        "rentre": rentre,
        "reste": max(0, du - rentre),
        "part": round(100 * rentre / du) if du else 0,
        "familles_payeuses": payeurs or 0,
    }
