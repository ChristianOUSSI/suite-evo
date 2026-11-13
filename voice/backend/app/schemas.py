from __future__ import annotations

from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from .utils import normalize_phone

Urgence = Literal["simple", "note", "urgent"]


def _phone(value: str | None) -> str | None:
    if value in (None, ""):
        return None
    return normalize_phone(value)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LineIn(BaseModel):
    label: str = Field(min_length=2, max_length=80)
    number: str = Field(default="", max_length=24)
    position: int = Field(default=1, ge=1, le=12)
    answered_by_human: bool = True
    capacity: int = Field(default=0, ge=0, le=8)

    @field_validator("number")
    @classmethod
    def canonise_number(cls, value: str) -> str:
        if not value:
            return ""
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Ce numéro ne correspond pas au plan camerounais.")
        return cleaned


class ScheduleIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    opens: time
    closes: time

    @field_validator("closes")
    @classmethod
    def fenetre_valide(cls, value: time, info) -> time:
        opens = info.data.get("opens")
        if opens is not None and value <= opens:
            raise ValueError("La fermeture doit suivre l'ouverture.")
        return value


class ClosureIn(BaseModel):
    starts: date
    ends: date
    reason: str = Field(min_length=2, max_length=120)
    reason_en: str = Field(default="", max_length=120)
    kind: Literal[
        "ferie", "pedagogique", "vacances", "evenement", "autre"
    ] = "autre"

    @field_validator("ends")
    @classmethod
    def plage_valide(cls, value: date, info) -> date:
        starts = info.data.get("starts")
        if starts is not None and value < starts:
            raise ValueError("La fin de la fermeture précède son début.")
        return value


class MenuEntryIn(BaseModel):
    digit: str = Field(pattern=r"^[0-9]$")
    label: str = Field(min_length=3, max_length=120)
    label_en: str = Field(default="", max_length=120)
    action: Literal["reponse", "rendezvous", "message", "transfert"] = "reponse"
    answer_id: int | None = None
    service_id: int | None = None
    target_line_id: int | None = None


class AnswerIn(BaseModel):
    statement: str = Field(min_length=6, max_length=200)
    keywords: str = Field(default="", max_length=300)
    body: str = Field(min_length=10)
    statement_en: str = Field(default="", max_length=200)
    keywords_en: str = Field(default="", max_length=300)
    body_en: str = Field(default="", max_length=4000)
    area: str = Field(default="Accueil", max_length=60)
    follow_up: str = Field(default="", max_length=120)

    @field_validator("body_en")
    @classmethod
    def english_needed(cls, value: str, info) -> str:
        statement = info.data.get("statement_en") or ""
        if statement and len(value.strip()) < 10:
            raise ValueError(
                "Une fiche en anglais demande au moins une phrase en anglais."
            )
        return value


class ServiceDayIn(BaseModel):
    weekday: int = Field(ge=0, le=6)
    opens: time
    closes: time

    @field_validator("closes")
    @classmethod
    def fenetre_valide(cls, value: time, info) -> time:
        opens = info.data.get("opens")
        if opens is not None and value <= opens:
            raise ValueError("La fermeture du guichet doit suivre son ouverture.")
        return value


class ServiceIn(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    room: str = Field(default="", max_length=80)
    duration_min: int = Field(default=20, ge=5, le=120)
    step_min: int = Field(default=20, ge=5, le=120)
    lead_days: int = Field(default=1, ge=0, le=30)
    horizon_days: int = Field(default=14, ge=1, le=60)
    note: str = Field(default="", max_length=200)
    days: list[ServiceDayIn] = Field(default_factory=list, max_length=7)


class AppointmentIn(BaseModel):
    service_id: int
    caller_name: str = Field(min_length=2, max_length=140)
    caller_phone: str = Field(max_length=24)
    starts_at: datetime
    note: str = Field(default="", max_length=240)
    origin: Literal["voix", "console", "comptoir"] = "console"

    @field_validator("caller_phone")
    @classmethod
    def canonise_phone(cls, value: str) -> str:
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Le numéro de l'appelant est incomplet.")
        return cleaned

    @field_validator("starts_at")
    @classmethod
    def secondes_ignores(cls, value: datetime) -> datetime:
        return value.replace(second=0, microsecond=0)


class AppointmentPatch(BaseModel):
    status: Literal["confirme", "annule", "manque", "venu"] | None = None
    note: str | None = Field(default=None, max_length=240)


class MessageIn(BaseModel):
    from_name: str = Field(min_length=2, max_length=140)
    from_phone: str = Field(max_length=24)
    body: str = Field(min_length=4)
    urgency: Urgence = "simple"
    language: Literal["fr", "en"] | None = None
    line_id: int | None = None
    promised_at: datetime | None = None
    promised_in_minutes: int | None = Field(default=None, ge=15, le=1440)

    @field_validator("from_phone")
    @classmethod
    def canonise_phone(cls, value: str) -> str:
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Le numéro de l'appelant est incomplet.")
        return cleaned


class MessagePatch(BaseModel):
    status: Literal["nouveau", "en_cours", "rappelle"] | None = None
    handled_by: str | None = Field(default=None, max_length=120)
    handled_note: str | None = Field(default=None, max_length=240)


class CallIn(BaseModel):
    line_id: int | None = None
    caller_phone: str = Field(default="", max_length=24)
    caller_name: str = Field(default="", max_length=140)
    handled: Literal["voix", "humain", "messagerie"] = "humain"
    outcome: Literal[
        "renseigne",
        "rendezvous",
        "message",
        "transfert",
        "raccroche",
        "hors_horaires",
        "sature",
    ] = "renseigne"
    language: Literal["fr", "en"] = "fr"
    question: str = Field(default="", max_length=300)
    digit: str = Field(default="", max_length=2)
    transcript: str = Field(default="", max_length=4000)
    duration_sec: int = Field(default=0, ge=0, le=7200)

    @field_validator("caller_phone")
    @classmethod
    def canonise_phone(cls, value: str) -> str | None:
        if not value:
            return ""
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Ce numéro ne correspond pas au plan camerounais.")
        return cleaned


class SimulateIn(BaseModel):
    """Le paramétrage d'un appel testé dans la console."""

    line_id: int
    caller_phone: str = Field(default="677084196", max_length=24)
    caller_name: str = Field(default="", max_length=140)
    at: datetime | None = None
    digit: str | None = Field(default=None, pattern=r"^[0-9]$")
    question: str = Field(default="", max_length=240)
    service_id: int | None = None
    appointment_start: datetime | None = None
    message_body: str = Field(default="", max_length=800)
    urgency: Urgence = "simple"
    asks_human: bool = False
    hang_up: bool = False
    asked_for: str = Field(default="", max_length=120)
    language: Literal["fr", "en"] | None = None
    notify: Literal["sms", "whatsapp", "appel_vocal", "aucun"] = "sms"

    @field_validator("caller_phone")
    @classmethod
    def canonise_phone(cls, value: str) -> str:
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Le numéro de l'appelant est incomplet.")
        return cleaned


class QuestionIn(BaseModel):
    """La phrase tapée dans la console pour éprouver le répertoire."""

    question: str = Field(min_length=3, max_length=240)
    language: Literal["fr", "en"] = "fr"


class HolidayYearIn(BaseModel):
    """L'année dont on veut importer les jours fériés camerounais."""

    year: int = Field(ge=2024, le=2040)


class DispatchIn(BaseModel):
    channel: Literal["sms", "whatsapp", "appel_vocal"]
    to_phone: str = Field(max_length=24)
    subject: str = Field(default="", max_length=120)
    body: str = Field(min_length=3, max_length=480)

    @field_validator("to_phone")
    @classmethod
    def canonise_phone(cls, value: str) -> str:
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Le numéro du destinataire est incomplet.")
        return cleaned


class ContactIn(BaseModel):
    """Un numéro que la voix doit reconnaître avant qu'il parle."""

    phone: str = Field(max_length=24)
    name: str = Field(default="", max_length=140)
    tag: Literal[
        "parent", "eleve", "fournisseur", "medecin", "administration", "autre"
    ] = "autre"
    note: str = Field(default="", max_length=240)
    salutation: str = Field(default="", max_length=60)

    @field_validator("phone")
    @classmethod
    def canonise_phone(cls, value: str) -> str:
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("Ce numéro ne correspond pas au plan camerounais.")
        return cleaned


class ContactPatch(BaseModel):
    name: str | None = Field(default=None, max_length=140)
    tag: Literal[
        "parent", "eleve", "fournisseur", "medecin", "administration", "autre"
    ] | None = None
    note: str | None = Field(default=None, max_length=240)
    salutation: str | None = Field(default=None, max_length=60)


class TeammateIn(BaseModel):
    """Un conseiller de plus dans la console."""

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(default="", max_length=128)
    role: Literal["standardiste", "responsable"] = "standardiste"


class SettingsIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    kind: Literal["universite", "ecole", "clinique", "agence"] = "universite"
    city: str = Field(default="Douala", max_length=60)
    quartier: str = Field(default="", max_length=80)
    main_line: str = Field(default="", max_length=24)
    agent_name: str = Field(default="Naëlle", min_length=2, max_length=60)
    greeting: str = Field(default="", max_length=400)
    greeting_en: str = Field(default="", max_length=400)
    language: Literal["fr", "en", "bilingue"] = "fr"
    tone: Literal["chaleureux", "sobre", "institutionnel"] = "chaleureux"
    callback_minutes: int = Field(default=90, ge=15, le=720)
    sms_price: int = Field(default=8, ge=0, le=50)
    discretion: bool = False
    sms_enabled: bool = True
    whatsapp_enabled: bool = True
    voice_enabled: bool = True
    auto_reminders: bool = True
    daily_log: bool = True

    @field_validator("main_line")
    @classmethod
    def canonise_line(cls, value: str) -> str:
        if not value:
            return ""
        cleaned = _phone(value)
        if cleaned is None:
            raise ValueError("La ligne principale ne suit pas le plan camerounais.")
        return cleaned
