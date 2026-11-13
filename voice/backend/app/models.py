from __future__ import annotations

from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import format_phone, utcnow

ORG_KINDS = ("universite", "ecole", "clinique", "agence")
LANGUES = ("fr", "en", "bilingue")
CALL_OUTCOMES = (
    "renseigne",
    "rendezvous",
    "message",
    "transfert",
    "raccroche",
    "hors_horaires",
    "sature",
)
HANDLED_BY = ("voix", "humain", "messagerie")
MESSAGE_STATUS = ("nouveau", "en_cours", "rappelle")
APPT_STATUS = ("confirme", "annule", "manque", "venu")
MENU_ACTIONS = ("reponse", "rendezvous", "message", "transfert")
DISPATCH_CHANNELS = ("sms", "whatsapp", "appel_vocal")
DISPATCH_STATUS = ("programme", "envoye", "echoue")
CLOSURE_KINDS = ("ferie", "pedagogique", "vacances", "evenement", "autre")
CONTACT_TAGS = ("parent", "eleve", "fournisseur", "medecin", "administration", "autre")


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    kind: Mapped[str] = mapped_column(String(20), default="universite")
    city: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    main_line: Mapped[str] = mapped_column(String(24), default="")
    agent_name: Mapped[str] = mapped_column(String(60), default="Naëlle")
    greeting: Mapped[str] = mapped_column(Text, default="")
    greeting_en: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(10), default="fr")
    tone: Mapped[str] = mapped_column(String(16), default="chaleureux")
    callback_minutes: Mapped[int] = mapped_column(Integer, default=90)
    plan: Mapped[str] = mapped_column(String(16), default="institution")
    monthly_fee: Mapped[int] = mapped_column(Integer, default=75_000)
    sms_price: Mapped[int] = mapped_column(Integer, default=8)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    daily_log: Mapped[bool] = mapped_column(Boolean, default=True)
    discretion: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    users: Mapped[list[User]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    lines: Mapped[list[Line]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by="Line.position",
    )
    answers: Mapped[list[Answer]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    services: Mapped[list[Service]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    appointments: Mapped[list[Appointment]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    calls: Mapped[list[Call]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    messages: Mapped[list[Message]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    closures: Mapped[list[Closure]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    contacts: Mapped[list["Contact"]] = relationship(
        back_populates="organization",
        cascade="all, delete-orphan",
        order_by="Contact.last_seen.desc()",
    )
    dispatches: Mapped[list[Dispatch]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )

    @property
    def main_line_display(self) -> str:
        return format_phone(self.main_line)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="standardiste")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped[Organization] = relationship(back_populates="users")


class Line(Base):
    """Un poste du standard : l'accueil, la scolarité, les finances."""

    __tablename__ = "lines"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    label: Mapped[str] = mapped_column(String(80))
    number: Mapped[str] = mapped_column(String(24), default="")
    position: Mapped[int] = mapped_column(Integer, default=1)
    answered_by_human: Mapped[bool] = mapped_column(Boolean, default=True)
    # 0 laisse le poste ouvert à volonté : beaucoup d'établissements
    # ne savent pas combien de lignes physiques ils ont.
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    organization: Mapped[Organization] = relationship(back_populates="lines")
    schedules: Mapped[list[Schedule]] = relationship(
        back_populates="line", cascade="all, delete-orphan", order_by="Schedule.weekday"
    )
    menu: Mapped[list[MenuEntry]] = relationship(
        back_populates="line",
        cascade="all, delete-orphan",
        order_by="MenuEntry.digit",
        foreign_keys="MenuEntry.line_id",
    )

    @property
    def number_display(self) -> str:
        return format_phone(self.number)


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(primary_key=True)
    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id", ondelete="CASCADE"), index=True
    )
    weekday: Mapped[int] = mapped_column(Integer)
    opens: Mapped[time] = mapped_column(Time)
    closes: Mapped[time] = mapped_column(Time)

    line: Mapped[Line] = relationship(back_populates="schedules")


class Closure(Base):
    __tablename__ = "closures"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    starts: Mapped[date] = mapped_column(Date)
    ends: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(String(120))
    reason_en: Mapped[str] = mapped_column(String(120), default="")
    kind: Mapped[str] = mapped_column(String(16), default="autre")

    organization: Mapped[Organization] = relationship(back_populates="closures")


class MenuEntry(Base):
    __tablename__ = "menu_entries"
    __table_args__ = (Index("ix_menu_line_digit", "line_id", "digit", unique=True),)

    id: Mapped[int] = mapped_column(primary_key=True)
    line_id: Mapped[int] = mapped_column(
        ForeignKey("lines.id", ondelete="CASCADE"), index=True
    )
    digit: Mapped[str] = mapped_column(String(2))
    label: Mapped[str] = mapped_column(String(120))
    label_en: Mapped[str] = mapped_column(String(120), default="")
    action: Mapped[str] = mapped_column(String(16), default="reponse")
    answer_id: Mapped[int | None] = mapped_column(
        ForeignKey("answers.id", ondelete="SET NULL"), nullable=True
    )
    service_id: Mapped[int | None] = mapped_column(
        ForeignKey("services.id", ondelete="SET NULL"), nullable=True
    )
    target_line_id: Mapped[int | None] = mapped_column(
        ForeignKey("lines.id", ondelete="SET NULL"), nullable=True
    )

    line: Mapped[Line] = relationship(back_populates="menu", foreign_keys=[line_id])
    answer: Mapped[Answer | None] = relationship()
    service: Mapped[Service | None] = relationship()
    target_line: Mapped[Line | None] = relationship(foreign_keys=[target_line_id])


class Answer(Base):
    """Une réponse du fonds : ce que l'établissement écrit, ce que la voix dit."""

    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    statement: Mapped[str] = mapped_column(String(200))
    keywords: Mapped[str] = mapped_column(String(300), default="")
    body: Mapped[str] = mapped_column(Text)
    statement_en: Mapped[str] = mapped_column(String(200), default="")
    keywords_en: Mapped[str] = mapped_column(String(300), default="")
    body_en: Mapped[str] = mapped_column(Text, default="")
    area: Mapped[str] = mapped_column(String(60), default="Accueil")
    follow_up: Mapped[str] = mapped_column(String(120), default="")
    hits: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped[Organization] = relationship(back_populates="answers")


class Service(Base):
    """Un guichet de rendez-vous : consultation, retrait de dossier."""

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    room: Mapped[str] = mapped_column(String(80), default="")
    duration_min: Mapped[int] = mapped_column(Integer, default=20)
    step_min: Mapped[int] = mapped_column(Integer, default=20)
    lead_days: Mapped[int] = mapped_column(Integer, default=1)
    horizon_days: Mapped[int] = mapped_column(Integer, default=14)
    note: Mapped[str] = mapped_column(String(200), default="")

    organization: Mapped[Organization] = relationship(back_populates="services")
    days: Mapped[list["ServiceDay"]] = relationship(
        back_populates="service",
        cascade="all, delete-orphan",
        order_by="ServiceDay.weekday",
    )


class ServiceDay(Base):
    __tablename__ = "service_days"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"), index=True
    )
    weekday: Mapped[int] = mapped_column(Integer)
    opens: Mapped[time] = mapped_column(Time)
    closes: Mapped[time] = mapped_column(Time)

    service: Mapped[Service] = relationship(back_populates="days")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"), index=True
    )
    reference: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    caller_name: Mapped[str] = mapped_column(String(140))
    caller_phone: Mapped[str] = mapped_column(String(24))
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    duration_min: Mapped[int] = mapped_column(Integer, default=20)
    language: Mapped[str] = mapped_column(String(4), default="fr")
    origin: Mapped[str] = mapped_column(String(16), default="voix")
    status: Mapped[str] = mapped_column(String(16), default="confirme")
    note: Mapped[str] = mapped_column(String(240), default="")
    reminded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped[Organization] = relationship(back_populates="appointments")
    service: Mapped[Service] = relationship()

    @property
    def caller_phone_display(self) -> str:
        return format_phone(self.caller_phone)


class Call(Base):
    """Une fiche d'appel, posée dans la main courante."""

    __tablename__ = "calls"
    __table_args__ = (Index("ix_calls_org_started", "organization_id", "started_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    line_id: Mapped[int | None] = mapped_column(
        ForeignKey("lines.id", ondelete="SET NULL"), nullable=True
    )
    caller_phone: Mapped[str] = mapped_column(String(24), default="")
    caller_name: Mapped[str] = mapped_column(String(140), default="")
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    duration_sec: Mapped[int] = mapped_column(Integer, default=0)
    handled: Mapped[str] = mapped_column(String(12), default="voix")
    outcome: Mapped[str] = mapped_column(String(20), default="renseigne")
    language: Mapped[str] = mapped_column(String(4), default="fr")
    digit: Mapped[str] = mapped_column(String(2), default="")
    question: Mapped[str] = mapped_column(String(300), default="")
    answer_id: Mapped[int | None] = mapped_column(
        ForeignKey("answers.id", ondelete="SET NULL"), nullable=True
    )
    appointment_id: Mapped[int | None] = mapped_column(
        ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True
    )
    transcript: Mapped[str] = mapped_column(Text, default="")

    organization: Mapped[Organization] = relationship(back_populates="calls")
    line: Mapped[Line | None] = relationship(foreign_keys=[line_id])
    answer: Mapped[Answer | None] = relationship()

    @property
    def caller_phone_display(self) -> str:
        return format_phone(self.caller_phone or None)


class Message(Base):
    """Un mot laissé par un appelant, avec le rappel promis."""

    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    line_id: Mapped[int | None] = mapped_column(
        ForeignKey("lines.id", ondelete="SET NULL"), nullable=True
    )
    from_name: Mapped[str] = mapped_column(String(140))
    from_phone: Mapped[str] = mapped_column(String(24))
    body: Mapped[str] = mapped_column(Text)
    urgency: Mapped[str] = mapped_column(String(12), default="simple")
    language: Mapped[str] = mapped_column(String(4), default="fr")
    promised_at: Mapped[datetime] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(12), default="nouveau")
    handled_by: Mapped[str] = mapped_column(String(120), default="")
    handled_note: Mapped[str] = mapped_column(String(240), default="")
    recalled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped[Organization] = relationship(back_populates="messages")
    line: Mapped[Line | None] = relationship()

    @property
    def from_phone_display(self) -> str:
        return format_phone(self.from_phone)

    @property
    def overdue(self) -> bool:
        return self.status != "rappelle" and self.promised_at < utcnow()


class Dispatch(Base):
    """Ce qui est parti vers un téléphone. En démo, rien ne quitte la machine."""

    __tablename__ = "dispatches"

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    channel: Mapped[str] = mapped_column(String(12), default="sms")
    to_phone: Mapped[str] = mapped_column(String(24))
    subject: Mapped[str] = mapped_column(String(120), default="")
    body: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(12), default="envoye")
    reference: Mapped[str] = mapped_column(String(24), default="")
    segments: Mapped[int] = mapped_column(Integer, default=1)
    cost: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(4), default="fr")
    planned_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organization: Mapped[Organization] = relationship(back_populates="dispatches")

    @property
    def to_phone_display(self) -> str:
        return format_phone(self.to_phone)


class Contact(Base):
    """Un numéro que le standard reconnaît : parent, fournisseur, médecin traitant."""

    __tablename__ = "contacts"
    __table_args__ = (
        Index("ix_contacts_org_phone", "organization_id", "phone", unique=True),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True
    )
    phone: Mapped[str] = mapped_column(String(24))
    name: Mapped[str] = mapped_column(String(140), default="")
    tag: Mapped[str] = mapped_column(String(20), default="autre")
    note: Mapped[str] = mapped_column(String(240), default="")
    salutation: Mapped[str] = mapped_column(String(60), default="")
    call_count: Mapped[int] = mapped_column(Integer, default=0)
    first_seen: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped[Organization] = relationship(back_populates="contacts")

    @property
    def phone_display(self) -> str:
        return format_phone(self.phone)
