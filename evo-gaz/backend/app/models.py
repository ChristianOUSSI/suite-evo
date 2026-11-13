from __future__ import annotations

"""Le dépôt de gaz : les clients et leurs livraisons de bonbonnes.

Un dépôt camerounais vend des bonbonnes de GPL : la commande arrive
par téléphone ou par la page publique, le livreur part, la bonbonne
arrive. Le stock de bonbonnes vides revient, le cycle recommence.
"""

from datetime import date as date_type, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


ROLES = ("responsable", "agent")
TYPES_CLIENT = ("particulier", "revendeur", "restaurant", "chantier")
STATUTS_LIVRAISON = ("commandee", "en_route", "livree", "annulee")


class Organisation(Base):
    """Le dépôt qui tient les clients et les livraisons."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    clients: Mapped[list[Client]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    livraisons: Mapped[list[Livraison]] = relationship(
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
    """Un client du dépôt : le nom, le numéro, le quartier, le type."""

    __tablename__ = "clients"
    __table_args__ = (
        UniqueConstraint("organisation_id", "telephone", name="uq_clients_telephone"),
        Index("ix_clients_nom", "nom"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    telephone: Mapped[str] = mapped_column(String(24), default="")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    type: Mapped[str] = mapped_column(String(20), default="particulier")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="clients")
    livraisons: Mapped[list[Livraison]] = relationship(back_populates="client")


class Livraison(Base):
    """Une livraison de bonbonnes : le client, la quantité, le statut, la date."""

    __tablename__ = "livraisons"
    __table_args__ = (Index("ix_livraisons_statut", "statut"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    quantite: Mapped[int] = mapped_column(Integer, default=1)
    prix_unitaire: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="commandee")
    date_commande: Mapped[date_type] = mapped_column(Date)
    date_livraison: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    adresse: Mapped[str] = mapped_column(String(160), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="livraisons")
    client: Mapped[Client] = relationship(back_populates="livraisons")
