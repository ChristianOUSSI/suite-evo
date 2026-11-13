from fastapi import APIRouter

from ..deps import CurrentUser, DbSession
from ..services import dispatch as envois
from ..services.present import etat_lignes, service_dict, tableau_bord
from ..utils import utcnow

router = APIRouter(tags=["tableau de bord"])


@router.get("/dashboard")
def dashboard(user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    # Le passage du matin pose les rappels de la veille avant d'afficher la journée.
    if org.daily_log:
        envois.balayage(db)
        envois.relances_a_faire(db, org)
        db.commit()
    return tableau_bord(db, org)


@router.get("/standard/etat")
def etat(user: CurrentUser, db: DbSession) -> dict:
    org = user.organization
    moment = utcnow()
    return {
        "moment": moment.isoformat(),
        "lines": etat_lignes(db, org, moment),
        "guichets": [
            service_dict(db, service, detail=False) for service in org.services
        ],
    }


@router.get("/standard/guichets")
def guichets(user: CurrentUser, db: DbSession) -> list[dict]:
    org = user.organization
    return [service_dict(db, service, detail=True) for service in org.services]
