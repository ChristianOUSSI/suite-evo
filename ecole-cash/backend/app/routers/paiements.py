from datetime import date

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from ..deps import CurrentEcole, CurrentUser, DbSession
from ..models import Ecole, Echeance, Eleve, Engagement, Paiement, Recu
from ..schemas import AnnulationIn, EnvoiTest, PaiementIn
from ..services import encaissement, messagerie, present, relances
from ..utils import canonise_telephone, fcfa, jour_court_fr

router = APIRouter(tags=["encaissement"])


def _paiement(db, ecole_id: int, identifiant: int) -> Paiement:
    paiement = db.get(Paiement, identifiant)
    if not paiement or paiement.ecole_id != ecole_id:
        raise HTTPException(status_code=404, detail="Ce règlement n'est pas ici.")
    return paiement


@router.get("/paiements")
def journal(
    ecole: CurrentEcole,
    db: DbSession,
    eleve: int | None = Query(default=None),
    mode: str | None = Query(default=None),
    jours: int = Query(default=30, ge=1, le=365),
    limite: int = Query(default=200, ge=1, le=500),
) -> dict:
    """Tout ce qui est rentré, le plus récent en haut."""
    since = date.today().toordinal() - jours
    lignes = db.scalars(
        select(Paiement)
        .where(Paiement.ecole_id == ecole.id)
        .order_by(Paiement.moment.desc())
    ).all()
    gardees = [
        entree
        for entree in lignes
        if entree.moment.toordinal() >= since
        and (not eleve or entree.eleve_id == eleve)
        and (not mode or entree.mode == mode)
    ]
    return {
        "jours": jours,
        "total": len(gardees),
        "somme": sum(
            entree.montant for entree in gardees if not entree.annule
        ),
        "paiements": [present.paiement_dict(entree) for entree in gardees[:limite]],
    }


@router.get("/paiements/{paiement_id}")
def une_entree(paiement_id: int, ecole: CurrentEcole, db: DbSession) -> dict:
    return present.paiement_dict(_paiement(db, ecole.id, paiement_id))


@router.post("/paiements")
def encaisser(
    entree: PaiementIn, ecole: CurrentEcole, db: DbSession, membre: CurrentUser
) -> dict:
    """L'argent rentre, le reçu part dans la foulée."""
    eleve = db.get(Eleve, entree.eleve_id)
    if not eleve or eleve.ecole_id != ecole.id:
        raise HTTPException(status_code=422, detail="Cet élève n'est pas ici.")
    annee = present.annee_courante(ecole)
    if not facture_ouverte(db, eleve, annee):
        raise HTTPException(
            status_code=422,
            detail=(
                "Aucune ardoise pour cette année. Engagez d'abord la classe ou "
                "posez un engagement."
            ),
        )
    try:
        paiement, recu = encaissement.encaisser(
            db,
            ecole,
            eleve,
            annee,
            entree.montant,
            entree.mode,
            entree.reference,
            membre.nom,
            entree.note,
        )
    except ValueError as erreur:
        raise HTTPException(status_code=422, detail=str(erreur)) from erreur

    relances.regulariser(db, ecole, eleve, annee)
    return {
        "paiement": present.paiement_dict(paiement),
        "recu": present.recu_dict(recu),
        "eleve": present.eleve_dict(db, eleve, annee),
    }


def facture_ouverte(db, eleve: Eleve, annee: str) -> bool:
    return (
        db.scalar(
            select(func.count(Engagement.id)).where(
                Engagement.eleve_id == eleve.id, Engagement.annee == annee
            )
        )
        or 0
    ) > 0


@router.post("/paiements/{paiement_id}/annuler")
def annuler(
    paiement_id: int,
    entree: AnnulationIn,
    ecole: CurrentEcole,
    db: DbSession,
) -> dict:
    paiement = _paiement(db, ecole.id, paiement_id)
    if paiement.annule:
        raise HTTPException(
            status_code=422, detail="Ce règlement est déjà annulé."
        )
    recu = encaissement.annuler(db, ecole, paiement, entree.motif)
    eleve = db.get(Eleve, paiement.eleve_id)
    lignes = db.scalars(
        select(Echeance)
        .join(Engagement, Echeance.engagement_id == Engagement.id)
        .where(Engagement.eleve_id == eleve.id)
    ).all()
    return {
        "paiement": present.paiement_dict(paiement),
        "recu": present.recu_dict(recu) if recu else None,
        "reste": sum(max(0, ligne.montant - ligne.impute) for ligne in lignes),
    }


@router.get("/recus")
def recus(
    ecole: CurrentEcole,
    db: DbSession,
    jours: int = Query(default=30, ge=1, le=365),
    statut: str | None = Query(default=None),
) -> dict:
    since = date.today().toordinal() - jours
    lignes = db.scalars(
        select(Recu).where(Recu.ecole_id == ecole.id).order_by(Recu.emission.desc())
    ).all()
    gardees = [
        recu
        for recu in lignes
        if recu.emission.toordinal() >= since
        and (not statut or recu.statut == statut)
    ]
    return {
        "jours": jours,
        "total": len(gardees),
        "recus": [present.recu_dict(recu) for recu in gardees],
    }


@router.post("/recus/{recu_id}/renvoyer")
def renvoyer(recu_id: int, ecole: CurrentEcole, db: DbSession) -> dict:
    """Un parent n'a rien reçu : on repousse le même texte, une autre référence."""
    recu = db.get(Recu, recu_id)
    if not recu or recu.ecole_id != ecole.id:
        raise HTTPException(status_code=404, detail="Ce reçu n'est pas ici.")
    eleve = db.get(Eleve, recu.paiement.eleve_id)
    vers = eleve.tuteur_telephone or ""
    try:
        trace = messagerie.envoyer(ecole, recu.canal, vers, recu.corps.split("\n")[0])
    except ValueError as erreur:
        raise HTTPException(status_code=422, detail=str(erreur)) from erreur
    recu.statut = trace["statut"]
    recu.reference = trace["reference"]
    recu.destinataire = trace["vers"]
    db.commit()
    return present.recu_dict(recu)


@router.get("/public/recus/{jeton}")
def verifier(jeton: str, db: DbSession) -> dict:
    """Le lien que la directrice donne au parent : ce reçu est-il vrai ?"""
    recu = db.scalar(select(Recu).where(Recu.jeton == jeton.strip().upper()))
    if not recu:
        raise HTTPException(
            status_code=404, detail="Ce numéro de reçu n'existe dans aucune école."
        )
    ecole = db.get(Ecole, recu.ecole_id)
    eleve = recu.paiement.eleve
    return {
        "valide": recu.statut != "annule",
        "numero": recu.numero,
        "statut": recu.statut,
        "statut_label": present.RECU_LABELS.get(recu.statut, recu.statut),
        "ecole": ecole.nom,
        "eleve": f"{eleve.prenoms} {eleve.nom}",
        "classe": eleve.classe.label if eleve.classe else "",
        "montant": recu.paiement.montant,
        "montant_label": fcfa(recu.paiement.montant),
        "mode": encaissement.MODES.get(recu.paiement.mode, recu.paiement.mode),
        "emission": recu.emission.isoformat(),
        "jour": jour_court_fr(recu.emission.date()),
    }


@router.post("/paiements/apercu")
def apercu(entree: EnvoiTest, ecole: CurrentEcole, db: DbSession) -> dict:
    """Ce que le parent lira, avant même de compter les billets."""
    numero = canonise_telephone(entree.a or "")
    eleve = (
        db.scalar(
            select(Eleve).where(
                Eleve.ecole_id == ecole.id, Eleve.tuteur_telephone == numero
            )
        )
        if numero
        else None
    )
    if not eleve:
        raise HTTPException(
            status_code=422,
            detail="Aucun parent joint à ce numéro dans cette école.",
        )
    engagement = db.scalar(
        select(Engagement).where(
            Engagement.eleve_id == eleve.id,
            Engagement.annee == present.annee_courante(ecole),
        )
    )
    reste = (
        sum(max(0, ligne.montant - ligne.impute) for ligne in engagement.echeances)
        if engagement
        else 0
    )
    return {
        "eleve": f"{eleve.prenoms} {eleve.nom}",
        "reste": reste,
        "message": messagerie.recu_texte(
            ecole,
            f"{eleve.prenoms} {eleve.nom}",
            reste,
            encaissement.MODES["especes"],
            "à venir",
        ),
    }
