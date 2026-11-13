from fastapi import APIRouter

from ..deps import CompteCourant, DbSession, EntrepriseCourante
from ..messages import refus
from ..schemas import ClientCorrection, EchangeEntree, RelanceEntree
from ..services import carnet, present

router = APIRouter(tags=["fiches"])

# Les fiches portent déjà leur journal et leurs relances : les relations sont
# chargées à la lecture, donc un seul aller suffit pour ouvrir un client.


@router.get("/clients/{client_id}")
def fiche(client_id: int, entreprise: EntrepriseCourante, db: DbSession) -> dict:
    return present.fiche_dict(carnet.client_de(db, entreprise, client_id))


@router.patch("/clients/{client_id}")
def corriger(
    client_id: int,
    entree: ClientCorrection,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Sortir un client du carnet est le seul geste réservé au responsable."""
    if entree.actif is not None and compte.role != "responsable":
        raise refus("droits", 403)
    client = carnet.corriger_client(db, entreprise, client_id, entree)
    return present.client_dict(client)


@router.post("/clients/{client_id}/echanges")
def joindre(
    client_id: int,
    entree: EchangeEntree,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    """Ce qui s'est dit. Le journal est le lieu du vendeur."""
    client = carnet.client_de(db, entreprise, client_id)
    echange = carnet.enregistrer_echange(db, entreprise, client.id, entree, compte)
    return {
        "echange": present.echange_dict(echange),
        "client": present.client_dict(carnet.client_de(db, entreprise, client_id)),
    }


@router.post("/clients/{client_id}/relances")
def programmer(
    client_id: int,
    entree: RelanceEntree,
    entreprise: EntrepriseCourante,
    compte: CompteCourant,
    db: DbSession,
) -> dict:
    relance = carnet.programmer(db, entreprise, client_id, entree, compte)
    return present.relance_dict(relance)
