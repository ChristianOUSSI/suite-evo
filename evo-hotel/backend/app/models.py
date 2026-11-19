from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Index,
    text,
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

# Réservation hôtelière : la maison, ses chambres, ses clients, et une ligne
# par séjour. Le statut se décide à l'écriture, la disponibilité se vérifie
# à la lecture - une chambre ne se loue pas deux fois au même soir.

TYPES_CHAMBRE = ("standard", "deluxe", "suite", "familiale")
STATUTS = ("demande", "confirmee", "en_cours", "terminee", "annulee")
ROLES = ("responsable", "receptionniste")


class Organisation(Base):
    """L'hôtel qui tient le cahier."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    chambres: Mapped[list[Chambre]] = relationship(
        back_populates="organisation", cascade="all", lazy="selectin"
    )
    clients: Mapped[list[Client]] = relationship(
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
    role: Mapped[str] = mapped_column(String(20), default="receptionniste")

    organisation: Mapped[Organisation] = relationship(back_populates="users")


class Chambre(Base):
    """Une chambre louable : son numéro, son type, son prix de la nuit."""

    __tablename__ = "chambres"

    __table_args__ = (
        UniqueConstraint("organisation_id", "numero", name="uq_chambre_numero"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    numero: Mapped[str] = mapped_column(String(12))
    type: Mapped[str] = mapped_column(String(20), default="standard")
    prix_par_nuit: Mapped[int] = mapped_column(Integer, default=15000)
    capacite: Mapped[int] = mapped_column(Integer, default=2)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    note: Mapped[str] = mapped_column(Text, default="")

    organisation: Mapped[Organisation] = relationship(back_populates="chambres")
    sejours: Mapped[list[Sejour]] = relationship(
        back_populates="chambre", cascade="all", lazy="selectin"
    )


class Client(Base):
    """Un client connu : la seconde fois, sa fiche est déjà là."""

    __tablename__ = "clients"

    __table_args__ = (
        Index(
            "uq_client_telephone",
            "organisation_id",
            "telephone",
            unique=True,
            sqlite_where=text("telephone <> ''"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    piece: Mapped[str] = mapped_column(String(120), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    actif: Mapped[bool] = mapped_column(Boolean, default=True)

    organisation: Mapped[Organisation] = relationship(back_populates="clients")
    sejours: Mapped[list[Sejour]] = relationship(
        back_populates="client", cascade="all", lazy="selectin"
    )


class Sejour(Base):
    """Un séjour : la chambre, le client, les dates, le statut.

    Les nuits se comptent par dates, jamais par nuits stockées : un séjour
    rallongé recalcule tout seul.
    """

    __tablename__ = "sejours"

    __table_args__ = (
        Index("ix_sejour_chambre_dates", "chambre_id", "arrivee", "depart"),
        Index("ix_sejour_statut", "statut"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    chambre_id: Mapped[int] = mapped_column(ForeignKey("chambres.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    arrivee: Mapped[date] = mapped_column(Date)
    depart: Mapped[date] = mapped_column(Date)
    statut: Mapped[str] = mapped_column(String(12), default="confirmee", index=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: _maintenant_naif()
    )

    chambre: Mapped[Chambre] = relationship(back_populates="sejours", lazy="joined")
    client: Mapped[Client] = relationship(back_populates="sejours", lazy="joined")
    auteur: Mapped[User | None] = relationship("User", lazy="joined")
