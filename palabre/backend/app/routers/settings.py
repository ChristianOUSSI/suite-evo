from __future__ import annotations

from fastapi import APIRouter, HTTPException

from ..config import settings
from ..deps import CurrentUser, DbSession
from ..schemas import SettingsOut, SettingsPatch
from ..services.payments import FEE_RATE, SUBSCRIPTION
from ..services.present import merchant_dict
from ..services.recovery import sync_merchant_reminders

router = APIRouter(prefix="/settings", tags=["réglages"])


def _settings_payload(user) -> dict:
    return {
        "merchant": merchant_dict(user.merchant),
        "pricing": {
            "subscription": SUBSCRIPTION,
            "fee_rate": round(FEE_RATE * 100),
            "plan_name": "Essentiel",
        },
        "demo_mode": settings.demo_mode,
    }


@router.get("", response_model=SettingsOut)
def get_settings(user: CurrentUser) -> dict:
    return _settings_payload(user)


@router.patch("", response_model=SettingsOut)
def update_settings(
    payload: SettingsPatch, user: CurrentUser, db: DbSession
) -> dict:
    merchant = user.merchant
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(merchant, field, value)

    if not (
        merchant.sms_enabled
        or merchant.whatsapp_enabled
        or merchant.voice_enabled
    ):
        raise HTTPException(
            status_code=422,
            detail="Gardez au moins un canal de relance actif.",
        )

    sync_merchant_reminders(db, merchant)
    db.commit()
    db.refresh(merchant)
    user.merchant = merchant
    return _settings_payload(user)
