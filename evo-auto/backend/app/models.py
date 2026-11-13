from __future__ import annotations

"""Le parc du concessionnaire : les véhicules et les clients.

Trois règles :

1. Un véhicule entre en vente, se réserve, se vend, se retire.
   Le statut se change d'un geste ; le passé ne se réécrit pas.
2. Un véhicule vendu garde son client et son prix de vente :
   la vente est une date, pas un commentaire.
3. Le catalogue public ne montre que ce qui est en vente —
   ni le vendeur, ni les clients.
"""

from datetime import date as date_type, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


def aujourdhui_defaut() -> date_type:
    from .utils import aujourdhui

    return aujourdhui()


ROLES = ("responsable", "agent")
CARBURANTS = ("essence", "diesel", "hybride", "electrique")
BOITES = ("manuelle", "automatique")
STATUTS_VEHICULE = ("en_vente", "reserve", "vendu", "retire")
TYPES_CLIENT = ("particulier", "entreprise", "garage")


class Organisation(Base):
    """Le concessionnaire qui tient le parc."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    vehicules: Mapped[list[Vehicule]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    clients: Mapped[list[Client]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), index=True)
    mot_de_passe: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(16), default="agent")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship()


class Client(Base):
    """Un acheteur ou un prospect : le nom, le numéro, le type."""

    __tablename__ = "clients"
    __table_args__ = (Index("ix_clients_telephone", "telephone"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    type: Mapped[str] = mapped_column(String(20), default="particulier")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="clients")
    vehicules: Mapped[list[Vehicule]] = relationship(back_populates="client")


class Vehicule(Base):
    """Un véhicule du parc : la fiche, le prix, le statut, la vente."""

    __tablename__ = "vehicules"
    __table_args__ = (
        Index("ix_vehicules_statut", "statut"),
        Index("ix_vehicules_marque", "marque"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    marque: Mapped[str] = mapped_column(String(60))
    modele: Mapped[str] = mapped_column(String(80))
    annee: Mapped[int] = mapped_column(Integer)
    kilometrage: Mapped[int] = mapped_column(Integer, default=0)
    carburant: Mapped[str] = mapped_column(String(12), default="essence")
    boite: Mapped[str] = mapped_column(String(12), default="manuelle")
    prix: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="en_vente")
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    date_vente: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="vehicules")
    client: Mapped[Client | None] = relationship(back_populates="vehicules")
