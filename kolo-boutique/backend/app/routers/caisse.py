from datetime import date

from fastapi import APIRouter
from sqlalchemy import select

from ..deps import CurrentBoutique, DbSession, MainCourante
from ..models import Comptage
from ..schemas import ComptageEntree
from ..services import present, tendance
from ..utils import fcfa, jour_label

router = APIRouter(tags=["caisse"])


@router.get("/tableau")
def tableau(boutique: CurrentBoutique, db: DbSession) -> dict:
    today = date.today()
    etat = tendance.etat_comptoir(db, boutique.id)
    return {
        **etat,
        "jour_label": jour_label(today),
        "semaine": trend_semaine(db, boutique.id, today),
        "serie": [
            {
                "jour": un["jour"],
                "chiffre": un["chiffre"],
                "chiffre_label": fcfa(un["chiffre"]),
                "benefice": un["benefice"],
                "benefice_label": fcfa(un["benefice"]),
                "ventes": un["ventes"],
            }
            for un in tendance.serie_jours(db, boutique.id, jours=7)
        ],
        "meilleures": tendance.meilleures_ventes(db, boutique.id, today),
    }


@router.get("/journees")
def journees(boutique: CurrentBoutique, db: DbSession, jours: int = 14) -> dict:
    feuilles = [trend_jour(un) for un in tendance.serie_jours(db, boutique.id, jours)]
    return {"jours": jours, "journees": feuilles}


@router.get("/caisse")
def caisse_du_jour(boutique: CurrentBoutique, db: DbSession, jour: str | None = None) -> dict:
    cible = date.fromisoformat(jour) if jour else date.today()
    etat = tendance.journee(db, boutique.id, cible)
    compte = db.scalar(
        select(Comptage).where(Comptage.boutique_id == boutique.id, Comptage.jour == cible)
    )
    attendu = fond_attendu(db, boutique.id, cible)
    return {
        "jour": cible.isoformat(),
        "jour_label": jour_label(cible),
        "ventes": etat["ventes"],
        "chiffre": etat["chiffre"],
        "chiffre_label": fcfa(etat["chiffre"]),
        "especes": etat["especes_jour"],
        "especes_label": fcfa(etat["especes_jour"]),
        "depenses": etat["depenses"],
        "depenses_label": fcfa(etat["depenses"]),
        "benefice": etat["benefice"],
        "benefice_label": fcfa(etat["benefice"]),
        "benefice_net": etat["benefice_net"],
        "benefice_net_label": fcfa(etat["benefice_net"]),
        "marge": etat["marge"],
        "attendu": attendu,
        "attendu_label": fcfa(attendu),
        "comptage": present.comptage_dict(compte) if compte else None,
    }


@router.post("/caisse/declarer")
def declarer(
    entree: ComptageEntree,
    boutique: CurrentBoutique,
    main: MainCourante,
    db: DbSession,
) -> dict:
    """Le tiroir compté du soir. L'écart reste écrit, même quand il fâche."""
    cible = entree.jour or date.today()
    attendu = fond_attendu(db, boutique.id, cible)
    compte = db.scalar(
        select(Comptage).where(Comptage.boutique_id == boutique.id, Comptage.jour == cible)
    )
    if compte is None:
        compte = Comptage(boutique_id=boutique.id, jour=cible)
        db.add(compte)

    compte.fond = entree.fond
    compte.compte = entree.compte
    compte.attendu = attendu
    compte.note = entree.note.strip()
    compte.tenu_par_id = main.id
    db.commit()
    return present.comptage_dict(compte)


def fond_attendu(db, boutique_id: int, jour: date) -> int:
    """Ce que le tiroir doit contenir : le fond du matin, moins les dépenses payées
    en espèces sur la journée, plus la recette en espèces."""
    etat = tendance.journee(db, boutique_id, jour)
    especes = etat["especes_jour"]
    sorties = sum(
        un.montant
        for un in tendance.depenses_du(db, boutique_id, jour)
    )
    compte = db.scalar(
        select(Comptage).where(Comptage.boutique_id == boutique_id, Comptage.jour == jour)
    )
    fond = compte.fond if compte else 0
    return max(0, fond + especes - sorties)



def trend_semaine(db, boutique_id: int, jour: date) -> dict:
    s = tendance.semaine(db, boutique_id, jour)
    return {
        "jour": s["jour"],
        "chiffre": s["chiffre"],
        "chiffre_label": fcfa(s["chiffre"]),
        "benefice": s["benefice"],
        "benefice_label": fcfa(s["benefice"]),
        "depenses": s["depenses"],
        "benefice_net": s["benefice_net"],
        "benefice_net_label": fcfa(s["benefice_net"]),
        "ventes": s["ventes"],
    }


def trend_jour(un: dict) -> dict:
    return {
        "jour": un["jour"],
        "chiffre": un["chiffre"],
        "chiffre_label": fcfa(un["chiffre"]),
        "cout": un["cout"],
        "benefice": un["benefice"],
        "benefice_label": fcfa(un["benefice"]),
        "depenses": un["depenses"],
        "benefice_net": un["benefice_net"],
        "benefice_net_label": fcfa(un["benefice_net"]),
        "ventes": un["ventes"],
        "marge": un["marge"],
        "ticket_moyen": un["ticket_moyen"],
        "ticket_moyen_label": fcfa(un["ticket_moyen"]),
    }
