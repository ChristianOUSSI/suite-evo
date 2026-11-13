from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from ..deps import CurrentEcole, DbSession
from ..models import Classe, Eleve, Engagement, Paiement
from ..schemas import EleveIn, ElevePatch
from ..services import facturation, present

router = APIRouter(tags=["élèves"])


def _eleve(db: Session, ecole_id: int, identifiant: int) -> Eleve:
    eleve = db.get(Eleve, identifiant)
    if not eleve or eleve.ecole_id != ecole_id:
        raise HTTPException(status_code=404, detail="Cet élève n'est pas ici.")
    return eleve


def _classe(db: Session, ecole_id: int, identifiant: int | None) -> Classe | None:
    if not identifiant:
        return None
    classe = db.get(Classe, identifiant)
    if not classe or classe.ecole_id != ecole_id:
        raise HTTPException(status_code=422, detail="Cette classe n'est pas ici.")
    return classe


def matricule(db: Session, ecole_id: int, classe: Classe | None, annee: str) -> str:
    tete = (classe.label if classe else "HORS").replace(" ", "").upper()
    total = (
        db.scalar(
            select(func.count(Eleve.id)).where(Eleve.ecole_id == ecole_id)
        )
        or 0
    )
    return f"{tete}-{annee[:2]}{annee[-2:]}-{total + 1:03d}"


@router.get("/eleves")
def liste(
    ecole: CurrentEcole,
    db: DbSession,
    classe: int | None = Query(default=None),
    etat: str | None = Query(default=None),
    motif: str | None = Query(default=None),
    annee: str | None = Query(default=None),
    limite: int = Query(default=150, ge=1, le=400),
) -> dict:
    """Le cahier des familles, filtrable par classe, par retard ou par nom."""
    cible = annee or present.annee_courante(ecole)
    requete = select(Eleve).where(Eleve.ecole_id == ecole.id)
    if classe:
        requete = requete.where(Eleve.classe_id == classe)
    if motif:
        filtre = f"%{motif.strip().lower()}%"
        requete = requete.where(
            or_(
                Eleve.prenoms.ilike(filtre),
                Eleve.nom.ilike(filtre),
                Eleve.matricule.ilike(filtre),
                Eleve.tuteur_nom.ilike(filtre),
            )
        )
    eleves = db.scalars(requete.order_by(Eleve.nom, Eleve.prenoms)).all()
    fiches = [present.eleve_dict(db, eleve, cible) for eleve in eleves]

    tris = {
        "retard": lambda fiche: fiche["en_retard"],
        "solde": lambda fiche: fiche["reste"] == 0,
        "suspendu": lambda fiche: fiche["statut"] == "suspendu",
        "sans_classe": lambda fiche: fiche["classe_id"] is None,
    }
    filtre = tris.get(etat or "")
    if filtre:
        fiches = [fiche for fiche in fiches if filtre(fiche)]

    return {
        "annee": cible,
        "total": len(fiches),
        "eleves": fiches[:limite],
        "attendu": sum(fiche["du"] for fiche in fiches),
        "rentre": sum(fiche["rentre"] for fiche in fiches),
        "reste": sum(fiche["reste"] for fiche in fiches),
        "retards": sum(1 for fiche in fiches if fiche["en_retard"]),
    }


@router.get("/eleves/{eleve_id}")
def fiche(eleve_id: int, ecole: CurrentEcole, db: DbSession) -> dict:
    eleve = _eleve(db, ecole.id, eleve_id)
    annee = present.annee_courante(ecole)
    paiements = db.scalars(
        select(Paiement)
        .where(Paiement.ecole_id == ecole.id, Paiement.eleve_id == eleve.id)
        .order_by(Paiement.moment.desc())
    ).all()
    return {
        "eleve": present.eleve_dict(db, eleve, annee),
        "paiements": [present.paiement_dict(entree) for entree in paiements],
        "annee": annee,
        "tuteur_telephones": [
            numero
            for numero in {eleve.tuteur_telephone, eleve.tuteur_second}
            if numero
        ],
    }


@router.post("/eleves")
def inscrire(entree: EleveIn, ecole: CurrentEcole, db: DbSession) -> dict:
    classe = _classe(db, ecole.id, entree.classe_id)
    annee = classe.annee if classe else present.annee_courante(ecole)
    eleve = Eleve(
        ecole_id=ecole.id,
        matricule=matricule(db, ecole.id, classe, annee),
        prenoms=entree.prenoms.strip(),
        nom=entree.nom.strip(),
        sexe=entree.sexe,
        classe_id=classe.id if classe else None,
        tuteur_nom=entree.tuteur_nom.strip(),
        tuteur_telephone=entree.tuteur_telephone,
        tuteur_second=entree.tuteur_second,
        tuteur_lien=entree.tuteur_lien.strip() or "parent",
        quartier=entree.quartier.strip(),
        note=entree.note.strip(),
    )
    db.add(eleve)
    db.flush()

    if classe:
        engagement = Engagement(
            ecole_id=ecole.id,
            eleve_id=eleve.id,
            annee=classe.annee,
            scolarite=classe.scolarite,
            cantine=classe.cantine,
            transport=classe.transport,
            autres=classe.autres,
            tranches=classe.tranches,
        )
        db.add(engagement)
        db.flush()
        facturation.poser_echeances(db, engagement, ecole.date_rentree)

    db.commit()
    return present.eleve_dict(db, eleve, annee)


@router.patch("/eleves/{eleve_id}")
def regler(
    eleve_id: int, entree: ElevePatch, ecole: CurrentEcole, db: DbSession
) -> dict:
    eleve = _eleve(db, ecole.id, eleve_id)
    changement = entree.model_dump(exclude_unset=True)
    if "classe_id" in changement:
        classe = _classe(db, ecole.id, changement["classe_id"])
        eleve.classe_id = classe.id if classe else None
    for champ, valeur in changement.items():
        if champ == "classe_id":
            continue
        setattr(eleve, champ, valeur)
    db.commit()
    return present.eleve_dict(db, eleve, present.annee_courante(ecole))


@router.delete("/eleves/{eleve_id}", status_code=204)
def retirer(eleve_id: int, ecole: CurrentEcole, db: DbSession) -> None:
    eleve = _eleve(db, ecole.id, eleve_id)
    payes = db.scalar(
        select(func.count(Paiement.id)).where(Paiement.eleve_id == eleve.id)
    )
    if payes:
        raise HTTPException(
            status_code=422,
            detail=(
                "Cette famille a déjà réglé. Classez l'élève en « parti » plutôt "
                "que d'effacer la trace."
            ),
        )
    db.delete(eleve)
    db.commit()


@router.post("/eleves/{eleve_id}/echeances")
def reposer_echeances(eleve_id: int, ecole: CurrentEcole, db: DbSession) -> dict:
    """Le barème bouge (remise, changement de classe) : on repose les termes."""
    eleve = _eleve(db, ecole.id, eleve_id)
    annee = present.annee_courante(ecole)
    engagement = facturation.engagement_de(db, eleve, annee)
    if not engagement:
        raise HTTPException(
            status_code=422, detail="Aucun engagement ouvert pour cette année."
        )
    lignes = facturation.poser_echeances(db, engagement, ecole.date_rentree)
    db.commit()
    return {
        "eleve": f"{eleve.prenoms} {eleve.nom}",
        "termes": len(lignes),
        "reste": facturation.rester(lignes),
    }
