from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif() -> datetime:
    """Une horodatée naïve en UTC : `datetime.utcnow` est déprécié."""
    return maintenant()

# L'agence immobilière : ses biens, ses demandes, ses visites.
# Le statut du bien se change à la main ; les compteurs se recalculent
# à la lecture. Chaque demande garde son canal - téléphone, WhatsApp,
# visite du dimanche.

ROLES = ("responsable", "agent")
TYPES = ("maison", "appartement", "chambre", "terrain", "bureau", "commercial")
STATUTS = ("disponible", "negociation", "loue", "vendu", "retire")
CANAUX = ("telephone", "whatsapp", "visite", "panneau", "bouche_a_oreille", "autre")
STATUTS_DEMANDE = ("nouvelle", "contactee", "visite", "convertie", "perdue")
ISSUES = ("a_venir", "ok", "absent", "refusee")


class Organisation(Base):
    """L'agence qui tient le registre des biens."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    biens: Mapped[list[Bien]] = relationship(
        back_populates="organisation", cascade="all", lazy="selectin"
    )
    users: Mapped[list[User]] = relationship(back_populates="organisation", lazy="selectin")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    mot_de_passe: Mapped[str] = mapped_column(String(300))
    role: Mapped[str] = mapped_column(String(16), default="agent")

    organisation: Mapped[Organisation] = relationship(back_populates="users")


class Bien(Base):
    """Un bien : son type, son prix, son quartier, son propriétaire."""

    __tablename__ = "biens"

    __table_args__ = (
        Index("ix_bien_org", "organisation_id"),
        Index("ix_bien_statut", "statut"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    type: Mapped[str] = mapped_column(String(20), default="appartement")
    titre: Mapped[str] = mapped_column(String(160), default="")
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    prix: Mapped[int] = mapped_column(Integer, default=0)
    surface_m2: Mapped[int] = mapped_column(Integer, default=0)
    chambres: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(16), default="disponible")
    proprietaire_nom: Mapped[str] = mapped_column(String(160), default="")
    proprietaire_telephone: Mapped[str] = mapped_column(String(24), default="")
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=lambda: _maintenant_naif())

    organisation: Mapped[Organisation] = relationship(back_populates="biens")
    agent: Mapped[User | None] = relationship("User", lazy="joined")
    visites: Mapped[list[Visite]] = relationship(
        back_populates="bien", cascade="all", lazy="selectin"
    )
    demandes: Mapped[list[Demande]] = relationship(
        back_populates="bien", cascade="all", lazy="selectin"
    )


class Demande(Base):
    """Une demande : le client qui appelle ou écrit pour un bien."""

    __tablename__ = "demandes"

    __table_args__ = (
        Index("ix_demande_bien", "bien_id"),
        Index("ix_demande_date", "date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    bien_id: Mapped[int | None] = mapped_column(ForeignKey("biens.id"), default=None)
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    canal: Mapped[str] = mapped_column(String(24), default="telephone")
    message: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(16), default="nouvelle")
    note: Mapped[str] = mapped_column(Text, default="")
    date: Mapped[date] = mapped_column(Date, default=lambda: _aujourdhui())
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=lambda: _maintenant_naif())

    organisation: Mapped[Organisation] = relationship()
    bien: Mapped[Bien | None] = relationship(back_populates="demandes", lazy="joined")
    auteur: Mapped[User | None] = relationship("User", lazy="joined")


class Visite(Base):
    """Une visite : le rendez-vous, son issue."""

    __tablename__ = "visites"

    __table_args__ = (
        Index("ix_visite_bien", "bien_id"),
        Index("ix_visite_date", "date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    bien_id: Mapped[int] = mapped_column(ForeignKey("biens.id"))
    date: Mapped[date] = mapped_column(Date, default=lambda: _aujourdhui())
    heure: Mapped[str] = mapped_column(String(5), default="10:00")
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    issue: Mapped[str] = mapped_column(String(12), default="a_venir")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=lambda: _maintenant_naif())

    organisation: Mapped[Organisation] = relationship()
    bien: Mapped[Bien] = relationship(back_populates="visites", lazy="joined")
    auteur: Mapped[User | None] = relationship("User", lazy="joined")


def _aujourdhui() -> date:
    from .utils import aujourdhui

    return aujourdhui()
