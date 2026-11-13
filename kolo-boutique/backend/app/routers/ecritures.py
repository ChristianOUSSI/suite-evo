from datetime import date

from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from ..deps import CurrentBoutique, DbSession, MainCourante
from ..models import Depense, Entree, Produit, Vente
from ..schemas import (
    AnnulationEntree,
    DepenseEntree,
    DicteeEntree,
    EntreeStock,
    VenteEntree,
)
from ..security import reference_vente
from ..services import dictee as dictee_service
from ..services import present, stock, tendance
from ..utils import fcfa

router = APIRouter(tags=["écritures"])

RAILS = {
    "especes": "especes_actifs",
    "momo_mtn": "momo_actif",
    "momo_orange": "orange_actif",
    "credit": "credit_accorde",
}


def _rail_autorise(boutique, mode: str) -> None:
    if mode not in RAILS:
        raise HTTPException(
            status_code=422,
            detail="Rail inconnu : espèces, MoMo, Orange Money ou crédit.",
        )
    if not getattr(boutique, RAILS[mode]):
        lever = {
            "especes": "Les espèces",
            "momo_mtn": "MTN MoMo",
            "momo_orange": "Orange Money",
            "credit": "Le crédit",
        }[mode]
        raise HTTPException(
            status_code=422, detail=f"{lever} est coupé à ce comptoir."
        )


@router.get("/ventes")
def journal_ventes(
    boutique: CurrentBoutique,
    db: DbSession,
    jours: int = 7,
    produit_id: int | None = None,
    limite: int = 200,
) -> dict:
    since = date.today().toordinal() - jours
    lignes = db.scalars(
        select(Vente)
        .where(Vente.boutique_id == boutique.id)
        .order_by(Vente.moment.desc())
    ).all()
    gardees = [
        un
        for un in lignes
        if un.jour.toordinal() >= since
        and (produit_id is None or un.produit_id == produit_id)
    ][:limite]

    rendues = [present.vente_dict(un) for un in gardees]
    solde = present_solde(gardees)
    return {
        "jours": jours,
        "total": len(rendues),
        "chiffre": solde["chiffre"],
        "chiffre_label": fcfa(solde["chiffre"]),
        "benefice": solde["benefice"],
        "benefice_label": fcfa(solde["benefice"]),
        "ventes": rendues,
    }


@router.post("/ventes")
def enregistrer_vente(
    entree: VenteEntree,
    boutique: CurrentBoutique,
    main: MainCourante,
    db: DbSession,
) -> dict:
    _rail_autorise(boutique, entree.mode)
    produit = stock.produit_de(boutique.id, entree.produit_id, db)
    vente = stock.appliquer_vente(
        db,
        boutique.id,
        produit,
        entree.quantite,
        entree.prix_cede,
        entree.mode,
        main.id,
        reference_vente(),
    )
    return {"vente": present.vente_dict(vente), "produit": present.produit_dict(produit)}


@router.post("/ventes/{vente_id}/annuler")
def annuler(
    vente_id: int,
    entree: AnnulationEntree,
    boutique: CurrentBoutique,
    db: DbSession,
) -> dict:
    vente = db.get(Vente, vente_id)
    if not vente or vente.boutique_id != boutique.id:
        raise HTTPException(status_code=404, detail="Cette vente n'est pas de ce comptoir.")
    rayee = stock.annuler_vente(db, vente, entree.motif.strip())
    produit = db.get(Produit, rayee.produit_id)
    etat = tendance.journee(db, boutique.id, rayee.jour)
    return {
        "vente": present.vente_dict(rayee),
        "produit": present.produit_dict(produit),
        "jour_chiffre": etat["chiffre"],
        "jour_benefice": etat["benefice"],
    }


@router.get("/entrees")
def journal_entrees(
    boutique: CurrentBoutique, db: DbSession, jours: int = 30, limite: int = 120
) -> dict:
    since = date.today().toordinal() - jours
    lignes = db.scalars(
        select(Entree)
        .where(Entree.boutique_id == boutique.id)
        .order_by(Entree.moment.desc())
    ).all()
    gardees = [un for un in lignes if un.jour.toordinal() >= since][:limite]
    total = sum(un.quantite * un.cout_unitaire for un in gardees)
    return {
        "jours": jours,
        "total": len(gardees),
        "debourse": total,
        "debourse_label": fcfa(total),
        "entrees": [present.entree_dict(un) for un in gardees],
    }


@router.post("/entrees")
def enregistrer_entree(
    entree: EntreeStock,
    boutique: CurrentBoutique,
    main: MainCourante,
    db: DbSession,
) -> dict:
    produit = stock.produit_de(boutique.id, entree.produit_id, db)
    ligne, melange = stock.appliquer_entree(
        db,
        boutique.id,
        produit,
        entree.quantite,
        entree.cout_unitaire,
        main.id,
        fournisseur=entree.fournisseur.strip(),
        note=entree.note.strip(),
    )
    return {"entree": present.entree_dict(ligne), "produit": present.produit_dict(melange)}


@router.get("/depenses")
def journal_depenses(
    boutique: CurrentBoutique, db: DbSession, jours: int = 30
) -> dict:
    since = date.today().toordinal() - jours
    lignes = db.scalars(
        select(Depense)
        .where(Depense.boutique_id == boutique.id)
        .order_by(Depense.jour.desc(), Depense.id.desc())
    ).all()
    gardees = [un for un in lignes if un.jour.toordinal() >= since]
    return {
        "jours": jours,
        "total": sum(un.montant for un in gardees),
        "total_label": fcfa(sum(un.montant for un in gardees)),
        "depenses": [present.depense_dict(un) for un in gardees],
    }


@router.post("/depenses")
def payer(
    entree: DepenseEntree, boutique: CurrentBoutique, db: DbSession
) -> dict:
    ligne = Depense(
        boutique_id=boutique.id,
        libelle=entree.libelle.strip(),
        categorie=entree.categorie,
        montant=entree.montant,
        jour=entree.jour or date.today(),
        note=entree.note.strip(),
    )
    db.add(ligne)
    db.commit()
    return present.depense_dict(ligne)


@router.post("/dictee/analyse")
def ecouter(
    entree: DicteeEntree, boutique: CurrentBoutique, db: DbSession
) -> dict:
    """La phrase est rendue en ligne prête à écrire, sans rien consigner."""
    return _rendu(entree, boutique, db, ecrite=False)


@router.post("/dictee")
def dicter(
    entree: DicteeEntree,
    boutique: CurrentBoutique,
    main: MainCourante,
    db: DbSession,
) -> dict:
    """La phrase du vocal entre au cahier."""
    return _rendu(entree, boutique, db, ecrite=True, main=main)


def _rendu(entree, boutique, db, ecrite: bool, main=None) -> dict:
    intention = dictee_service.interprete(db, boutique.id, entree.phrase)
    rendu = _dictee_dict(intention)
    if not ecrite:
        return {"ecrite": False, **rendu}
    trace = dictee_service.applique(db, boutique.id, main, intention, reference_vente())
    return {"ecrite": True, **rendu, "ecriture": trace}


def _dictee_dict(intention) -> dict:
    return {
        "verbe": intention.verbe,
        "produit": present.produit_dict(intention.produit) if intention.produit else None,
        "quantite": intention.quantite,
        "prix": intention.prix,
        "prix_label": fcfa(intention.prix) if intention.prix else "",
        "mode": intention.mode,
        "libelle": intention.libelle,
        "categorie": intention.categorie,
        "brut": intention.brut,
        "doute": intention.doute,
    }


def present_solde(ventes) -> dict:
    chiffre = sum(un.prix_cede * un.quantite for un in ventes)
    benefice = sum((un.prix_cede - un.cout_unitaire) * un.quantite for un in ventes)
    return {"chiffre": chiffre, "benefice": benefice}
