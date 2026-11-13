from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ..deps import CurrentEcole, DbSession
from ..models import Echeance, Engagement, Eleve, Relance
from ..schemas import RelanceIn
from ..services import messagerie, present, relances
from ..utils import maintenant

router = APIRouter(tags=["relances"])


@router.get("/relances")
def file(
    ecole: CurrentEcole,
    db: DbSession,
    etat: str | None = Query(default=None),
    limite: int = Query(default=120, ge=1, le=400),
) -> dict:
    """Les avis programmés, ceux qui sont partis, ceux qui ne servent plus."""
    lignes = db.scalars(
        select(Relance)
        .where(Relance.ecole_id == ecole.id)
        .order_by(Relance.programme.desc())
    ).all()
    if etat == "filees":
        lignes = [l for l in lignes if not l.envoyee and not l.annulee]
    elif etat == "envoyees":
        lignes = [l for l in lignes if l.envoyee]
    elif etat == "annulees":
        lignes = [l for l in lignes if l.annulee]

    dues = sum(
        1
        for l in lignes
        if not l.envoyee and not l.annulee
    )
    return {
        "total": len(lignes),
        "a_envoyer": dues,
        "relances": [present.relance_dict(l) for l in lignes[:limite]],
    }


@router.post("/relances/programmer")
def programmer(
    ecole: CurrentEcole,
    db: DbSession,
    annee: str | None = Query(default=None),
) -> dict:
    cible = annee or present.annee_courante(ecole)
    posees = relances.programme(db, ecole, cible)
    return {"annee": cible, "posees": posees}


@router.post("/relances/lancer")
def lancer(ecole: CurrentEcole, db: DbSession) -> dict:
    """La tournée du matin : ce qui est dû part, ce qui est réglé tombe."""
    resultat = relances.relancer(db, ecole)
    resultat["canal"] = "whatsapp" if ecole.whatsapp_actif else "sms"
    return resultat


@router.post("/relances")
def notifier(entree: RelanceIn, ecole: CurrentEcole, db: DbSession) -> dict:
    """Un mot posé à la main, hors calendrier, pour une famille précise."""
    eleve = db.get(Eleve, entree.eleve_id)
    if not eleve or eleve.ecole_id != ecole.id:
        raise HTTPException(status_code=422, detail="Cet élève n'est pas ici.")
    ligne = db.scalar(
        select(Echeance)
        .join(Engagement, Echeance.engagement_id == Engagement.id)
        .where(
            Engagement.eleve_id == eleve.id,
            Engagement.annee == present.annee_courante(ecole),
        )
        .order_by(Echeance.due)
    )
    if not ligne:
        raise HTTPException(
            status_code=422,
            detail=(
                "Aucune échéance ouverte pour cet élève : rien à rappeler. "
                "Encaissez ou engagez la classe d'abord."
            ),
        )

    try:
        trace = messagerie.envoyer(
            ecole, entree.canal, eleve.tuteur_telephone or "", entree.corps
        )
    except ValueError as erreur:
        raise HTTPException(status_code=422, detail=str(erreur)) from erreur

    relance = Relance(
        ecole_id=ecole.id,
        eleve_id=eleve.id,
        echeance_id=ligne.id,
        palier=entree.palier,
        libelle="avis à la main",
        programme=maintenant().date(),
        canal=entree.canal,
        corps=trace["corps"],
        envoyee=True,
        envoyee_le=maintenant(),
        reference=trace["reference"],
    )
    db.add(relance)
    db.commit()
    return present.relance_dict(relance)
