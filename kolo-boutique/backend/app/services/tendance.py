from __future__ import annotations

# La tendance : ce que le comptoir a rapporté, jour par jour, sans que quelqu'un
# ait à ressortir le cahier papier. Le bénéfice d'une vente est figé à sa ligne
# (prix cédé moins coût du jour de la vente), donc les rachats plus chers d'hier
# ne réécrivent jamais une journée déjà close.

from datetime import date, timedelta

from sqlalchemy import select

from ..models import Depense, Produit, Vente
from . import stock


def ventes_du(db, boutique_id: int, jour: date) -> list[Vente]:
    return list(
        db.scalars(
            select(Vente)
            .where(
                Vente.boutique_id == boutique_id,
                Vente.jour == jour,
                Vente.annule.is_(False),
            )
            .order_by(Vente.moment.desc())
        ).all()
    )


def depenses_du(db, boutique_id: int, jour: date) -> list[Depense]:
    return list(
        db.scalars(
            select(Depense).where(
                Depense.boutique_id == boutique_id, Depense.jour == jour
            )
        ).all()
    )


def solde_ventes(ventes: list[Vente]) -> dict:
    """Chiffre, coût et marge d'un lot de ventes."""
    chiffre = sum(un.prix_cede * un.quantite for un in ventes)
    cout = sum(un.cout_unitaire * un.quantite for un in ventes)
    return {
        "ventes": len(ventes),
        "chiffre": chiffre,
        "cout": cout,
        "benefice": chiffre - cout,
    }


def journee(db, boutique_id: int, jour: date) -> dict:
    ventes = ventes_du(db, boutique_id, jour)
    paye = solde_ventes(ventes)
    sorties = depenses_du(db, boutique_id, jour)
    depenses = sum(un.montant for un in sorties)
    encaisse_especes = sum(
        un.prix_cede * un.quantite for un in ventes if un.mode == "especes"
    )

    return {
        "jour": jour.isoformat(),
        **paye,
        "ticket_moyen": round(paye["chiffre"] / paye["ventes"]) if paye["ventes"] else 0,
        "depenses": depenses,
        "benefice_net": paye["benefice"] - depenses,
        "marge": (
            round(100 * paye["benefice"] / paye["chiffre"]) if paye["chiffre"] else 0
        ),
        "especes_jour": encaisse_especes,
        "lignes": len(ventes) + len(sorties),
    }


def serie_jours(db, boutique_id: int, jours: int = 7) -> list[dict]:
    """Les jours d'affilée, du plus récent au plus ancien."""
    today = date.today()
    return [journee(db, boutique_id, today - timedelta(days=un)) for un in range(jours)]


def semaine(db, boutique_id: int, jour: date) -> dict:
    lundi = jour - timedelta(days=jour.weekday())
    total = {"chiffre": 0, "cout": 0, "benefice": 0, "ventes": 0, "depenses": 0}
    for un in range(7):
        etat = journee(db, boutique_id, lundi + timedelta(days=un))
        for cle in total:
            total[cle] += etat[cle]
    total["jour"] = lundi.isoformat()
    total["benefice_net"] = total["benefice"] - total["depenses"]
    return total


def meilleures_ventes(db, boutique_id: int, jour: date, limite: int = 5) -> list[dict]:
    ventes = ventes_du(db, boutique_id, jour)
    par_produit: dict[int, dict] = {}
    for un in ventes:
        case = par_produit.setdefault(
            un.produit_id,
            {"produit": un.produit.nom, "unite": un.produit.unite, "quantite": 0, "chiffre": 0, "benefice": 0},
        )
        case["quantite"] += un.quantite
        case["chiffre"] += un.prix_cede * un.quantite
        case["benefice"] += (un.prix_cede - un.cout_unitaire) * un.quantite
    return sorted(par_produit.values(), key=lambda c: c["chiffre"], reverse=True)[:limite]


def etat_comptoir(db, boutique_id: int) -> dict:
    """La vitre du jour : la caisse, le stock qui baisse, ce qui reste à encaisser."""
    today = date.today()
    etat = journee(db, boutique_id, today)
    alertes = stock.alertes_stock(db, boutique_id)
    valeur_reserve = sum(
        un.prix_achat * un.stock
        for un in db.scalars(
            select(Produit).where(Produit.boutique_id == boutique_id, Produit.actif.is_(True))
        ).all()
    )
    return {
        "jour": today.isoformat(),
        "chiffre": etat["chiffre"],
        "benefice": etat["benefice"],
        "benefice_net": etat["benefice_net"],
        "marge": etat["marge"],
        "ventes": etat["ventes"],
        "article_alerte": len(alertes),
        "reserve": valeur_reserve,
        "a_racheter": [un.nom for un in alertes[:8]],
    }
