from __future__ import annotations

"""Le cahier des frais : qui a payé, combien, et le reçu qui le prouve.

Trois règles :

1. Le montant attendu se fige sur la fiche de l'élève. Le reste se calcule à
   la lecture : attendu − somme des versements non annulés.
2. Chaque versement porte un code de reçu unique, dérivé d'un secret serveur :
   il ne se devine pas, il ne se forge pas, il ne livre que le versement
   qu'il désigne - ni les autres élèves, ni les autres classes.
3. Annuler un versement ne l'efface pas : il garde sa ligne, le reste remonte
   tout seul. On ne réécrit pas le passé.
"""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..messages import refus
from ..models import Classe, Eleve, Organisation, User, Versement
from ..schemas import VersementEntree
from ..security import code_de_controle
from ..utils import aujourdhui, periode_de


def classe_de(db: Session, organisation: Organisation, classe_id: int) -> Classe:
    classe = db.get(Classe, classe_id)
    if classe is None or classe.organisation_id != organisation.id:
        raise refus("classe_inconnue", 404)
    return classe


def eleve_de(db: Session, organisation: Organisation, eleve_id: int) -> Eleve:
    eleve = db.get(Eleve, eleve_id)
    if eleve is None or eleve.organisation_id != organisation.id:
        raise refus("eleve_inconnu", 404)
    return eleve


def versement_de(db: Session, organisation: Organisation, versement_id: int) -> Versement:
    versement = db.get(Versement, versement_id)
    if versement is None or versement.organisation_id != organisation.id:
        raise refus("versement_inconnu", 404)
    return versement


def paye(eleve: Eleve) -> int:
    return sum(un.montant for un in eleve.versements if not un.annule)


def reste(eleve: Eleve) -> int:
    return max(0, eleve.frais_attendu - paye(eleve))


def _recu_libre(db: Session, organisation_id: int, eleve_id: int, date_versement: date) -> str:
    """Un code de reçu unique, tiré du secret serveur."""
    for tentative in range(20):
        code = code_de_controle(
            organisation_id, eleve_id, f"{date_versement.isoformat()}-{tentative}"
        )[:10].upper()
        pris = db.scalar(
            select(Versement.id).where(
                Versement.organisation_id == organisation_id,
                Versement.recu == code,
            )
        )
        if pris is None:
            return code
    raise refus("saisie")


def encaisser(
    db: Session, organisation: Organisation, entree: VersementEntree, compte: User
) -> Versement:
    """Un versement : son montant, son moyen, son reçu qui prouve."""
    eleve = eleve_de(db, organisation, entree.eleve_id)
    if not eleve.actif:
        raise refus("eleve_inconnu", 404)
    jour = entree.date or aujourdhui()
    if jour > aujourdhui():
        raise refus("saisie", date="le jour")

    versement = Versement(
        organisation_id=organisation.id,
        eleve_id=eleve.id,
        montant=entree.montant,
        moyen=entree.moyen,
        date=jour,
        periode=entree.periode or periode_de(jour),
        note=entree.note.strip(),
        recu=_recu_libre(db, organisation.id, eleve.id, jour),
        cree_par=compte.id,
    )
    db.add(versement)
    db.commit()
    db.refresh(versement)
    return versement


def annuler_versement(
    db: Session, organisation: Organisation, versement_id: int, note: str
) -> Versement:
    versement = versement_de(db, organisation, versement_id)
    if versement.annule:
        raise refus("versement_annule", 409)
    versement.annule = True
    if note.strip():
        versement.note = (versement.note + " · " + note.strip()).strip(" ·")
    db.commit()
    db.refresh(versement)
    return versement


def recu_par_code(db: Session, code: str) -> Versement | None:
    """Le reçu public : un code, un versement, rien d'autre."""
    code = (code or "").strip().upper()
    if not code:
        return None
    return db.scalar(
        select(Versement).where(
            Versement.recu == code, Versement.annule.is_(False)
        )
    )


def etat(db: Session, organisation: Organisation) -> dict:
    """La vitre de la caisse de l'école : qui doit, ce que le mois a encaissé."""
    ce_mois = periode_de(aujourdhui())
    classes = db.scalars(
        select(Classe).where(Classe.organisation_id == organisation.id)
    ).all()
    eleves = db.scalars(
        select(Eleve).where(
            Eleve.organisation_id == organisation.id, Eleve.actif.is_(True)
        )
    ).all()
    versements = db.scalars(
        select(Versement).where(
            Versement.organisation_id == organisation.id,
            Versement.annule.is_(False),
        )
    ).all()
    du_mois = [un for un in versements if un.periode == ce_mois]
    return {
        "jour": aujourdhui().isoformat(),
        "periode": ce_mois,
        "classes": sum(1 for un in classes if un.actif),
        "eleves": len(eleves),
        "encaisses": len(du_mois),
        "ca_mois": sum(un.montant for un in du_mois),
        "ca_total": sum(un.montant for un in versements),
        "reste_total": sum(reste(un) for un in eleves),
    }


def liste_eleves(
    db: Session,
    organisation: Organisation,
    classe_id: int | None = None,
    seulement_restants: bool = False,
) -> list[dict]:
    from .present import eleve_dict

    requete = (
        select(Eleve)
        .where(Eleve.organisation_id == organisation.id)
        .order_by(Eleve.nom)
    )
    if classe_id is not None:
        requete = requete.where(Eleve.classe_id == classe_id)
    eleves = list(db.scalars(requete).all())
    resultats = [eleve_dict(un) for un in eleves]
    if seulement_restants:
        resultats = [un for un in resultats if un["reste"] > 0]
    return resultats


def liste_versements(
    db: Session,
    organisation: Organisation,
    eleve_id: int | None = None,
    periode: str | None = None,
    limite: int = 500,
) -> list[dict]:
    from .present import versement_dict

    requete = (
        select(Versement)
        .where(Versement.organisation_id == organisation.id)
        .order_by(Versement.date.desc(), Versement.id.desc())
        .limit(limite)
    )
    if eleve_id is not None:
        requete = requete.where(Versement.eleve_id == eleve_id)
    if periode:
        requete = requete.where(Versement.periode == periode)
    return [versement_dict(un) for un in db.scalars(requete).all()]


def recap(db: Session, organisation: Organisation, periode: str) -> dict:
    """Le mois des frais : encaissé par classe, reste à payer par élève."""
    import re as _re

    if not _re.match(r"^\d{4}-(0[1-9]|1[0-2])$", periode or ""):
        raise refus("periode_inconnue")

    versements = db.scalars(
        select(Versement).where(
            Versement.organisation_id == organisation.id,
            Versement.periode == periode,
            Versement.annule.is_(False),
        )
    ).all()
    eleves = db.scalars(
        select(Eleve).where(
            Eleve.organisation_id == organisation.id, Eleve.actif.is_(True)
        )
    ).all()

    par_classe: dict[int, dict] = {}
    for un in eleves:
        cle = un.classe_id
        if cle not in par_classe:
            par_classe[cle] = {
                "classe_id": cle,
                "classe": un.classe.nom,
                "eleves": 0,
                "attendu": 0,
                "reste": 0,
            }
        par_classe[cle]["eleves"] += 1
        par_classe[cle]["attendu"] += un.frais_attendu
        par_classe[cle]["reste"] += reste(un)

    par_eleve = []
    for un in eleves:
        paye_mois = sum(
            v.montant for v in un.versements if not v.annule and v.periode == periode
        )
        par_eleve.append(
            {
                "eleve_id": un.id,
                "nom": un.nom,
                "classe": un.classe.nom,
                "paye": paye_mois,
                "reste": reste(un),
                "solde": un.frais_attendu - paye(un),
            }
        )

    return {
        "periode": periode,
        "versements": len(versements),
        "encaisses": sum(un.montant for un in versements),
        "par_classe": sorted(par_classe.values(), key=lambda un: un["classe"]),
        "par_eleve": sorted(par_eleve, key=lambda un: (-un["reste"], un["nom"])),
    }
