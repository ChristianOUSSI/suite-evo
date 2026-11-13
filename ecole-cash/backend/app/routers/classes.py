from fastapi import APIRouter, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..deps import CurrentEcole, DbSession
from ..models import Classe, Eleve, Engagement
from ..schemas import ClasseIn
from ..services import facturation, present, relances

router = APIRouter(tags=["classes"])


def _classe(db: Session, ecole_id: int, identifiant: int) -> Classe:
    classe = db.get(Classe, identifiant)
    if not classe or classe.ecole_id != ecole_id:
        raise HTTPException(status_code=404, detail="Cette classe n'est pas ici.")
    return classe


@router.get("/classes")
def liste(ecole: CurrentEcole, db: DbSession) -> list[dict]:
    classes = db.scalars(
        select(Classe)
        .where(Classe.ecole_id == ecole.id)
        .order_by(Classe.annee, Classe.niveau)
    ).all()
    return [present.classe_dict(classe, ecole) for classe in classes]


@router.post("/classes")
def ouvrir_classe(entree: ClasseIn, ecole: CurrentEcole, db: DbSession) -> dict:
    jumeau = db.scalar(
        select(Classe.id).where(
            Classe.ecole_id == ecole.id,
            Classe.label == entree.label.strip(),
            Classe.annee == entree.annee,
        )
    )
    if jumeau:
        raise HTTPException(
            status_code=422,
            detail=f"{entree.label.strip()} est déjà ouverte pour {entree.annee}.",
        )
    classe = Classe(
        ecole_id=ecole.id,
        label=entree.label.strip(),
        niveau=entree.niveau,
        salle=entree.salle.strip(),
        titulaire=entree.titulaire.strip(),
        effectif_max=entree.effectif_max,
        annee=entree.annee,
        scolarite=entree.scolarite,
        cantine=entree.cantine,
        transport=entree.transport,
        autres=entree.autres,
        tranches=entree.tranches,
    )
    db.add(classe)
    db.commit()
    return present.classe_dict(classe, ecole)


@router.patch("/classes/{classe_id}")
def regler_classe(
    classe_id: int, entree: ClasseIn, ecole: CurrentEcole, db: DbSession
) -> dict:
    classe = _classe(db, ecole.id, classe_id)
    classe.label = entree.label.strip()
    classe.niveau = entree.niveau
    classe.salle = entree.salle.strip()
    classe.titulaire = entree.titulaire.strip()
    classe.effectif_max = entree.effectif_max
    classe.annee = entree.annee
    classe.scolarite = entree.scolarite
    classe.cantine = entree.cantine
    classe.transport = entree.transport
    classe.autres = entree.autres
    classe.tranches = entree.tranches
    db.commit()
    return present.classe_dict(classe, ecole)


@router.delete("/classes/{classe_id}", status_code=204)
def fermer_classe(classe_id: int, ecole: CurrentEcole, db: DbSession) -> None:
    classe = _classe(db, ecole.id, classe_id)
    if classe.eleves:
        raise HTTPException(
            status_code=422,
            detail=(
                f"{len(classe.eleves)} élèves tiennent encore dans cette classe. "
                "Changez-les de classe avant de la fermer."
            ),
        )
    db.delete(classe)
    db.commit()


@router.post("/classes/{classe_id}/engager")
def engager_la_classe(classe_id: int, ecole: CurrentEcole, db: DbSession) -> dict:
    """Ouvrir l'année : une ligne par élève de la classe, avec son calendrier."""
    classe = _classe(db, ecole.id, classe_id)
    creees = 0
    deja = 0
    for eleve in classe.eleves:
        existant = db.scalar(
            select(Engagement).where(
                Engagement.eleve_id == eleve.id, Engagement.annee == classe.annee
            )
        )
        if existant:
            deja += 1
            continue
        db.add(
            Engagement(
                ecole_id=ecole.id,
                eleve_id=eleve.id,
                annee=classe.annee,
                scolarite=classe.scolarite,
                cantine=classe.cantine,
                transport=classe.transport,
                autres=classe.autres,
                tranches=classe.tranches,
            )
        )
        creees += 1
    db.commit()
    lignes = db.scalars(
        select(Engagement).where(
            Engagement.ecole_id == ecole.id, Engagement.annee == classe.annee
        )
    ).all()
    for engagement in lignes:
        facturation.poser_echeances(db, engagement, ecole.date_rentree)
    db.commit()
    posees = relances.programme(db, ecole, classe.annee)
    return {
        "classe": classe.label,
        "annee": classe.annee,
        "creees": creees,
        "deja_posees": deja,
        "eleves": len(lignes),
        "relances_programmees": posees,
    }
