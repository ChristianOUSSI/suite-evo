from __future__ import annotations

"""Le parc et le stock : les voitures et les pièces détachées.

Deux règles :

1. Une voiture entre en vente, se réserve, se vend, se retire.
   Une pièce entre en stock, descend à la vente, se réapprovisionne.
2. La vente d'une pièce porte son client, sa date et son prix.
   Le stock ne ment jamais : on ne vend pas ce qu'on n'a pas.
3. Le catalogue public ne montre que ce qui est en vente -
   ni l'acheteur, ni les clients, ni le garage.
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
STATUTS_VOITURE = ("en_vente", "reserve", "vendu", "retire")
TYPES_CLIENT = ("particulier", "entreprise", "garage")


class Organisation(Base):
    """Le garage qui tient le parc et le stock."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    voitures: Mapped[list[Voiture]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    pieces: Mapped[list[Piece]] = relationship(
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
    """Un acheteur ou un garage partenaire : le nom, le numéro, le type."""

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
    voitures: Mapped[list[Voiture]] = relationship(back_populates="client")
    ventes_pieces: Mapped[list[Piece]] = relationship(back_populates="client")


class Voiture(Base):
    """Une voiture du parc : la fiche, le prix, le statut, la vente."""

    __tablename__ = "voitures"
    __table_args__ = (
        Index("ix_voitures_statut", "statut"),
        Index("ix_voitures_marque", "marque"),
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

    organisation: Mapped[Organisation] = relationship(back_populates="voitures")
    client: Mapped[Client | None] = relationship(back_populates="voitures")


class Piece(Base):
    """Une pièce détachée en stock : la référence, le stock, la vente."""

    __tablename__ = "pieces"
    __table_args__ = (
        UniqueConstraint("reference", name="uq_pieces_reference"),
        Index("ix_pieces_statut", "statut"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    reference: Mapped[str] = mapped_column(String(16))
    designation: Mapped[str] = mapped_column(String(160))
    compatibilite: Mapped[str] = mapped_column(String(120), default="")
    stock: Mapped[int] = mapped_column(Integer, default=0)
    prix_achat: Mapped[int] = mapped_column(Integer, default=0)
    prix_vente: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="en_stock")
    quantite_vendue: Mapped[int] = mapped_column(Integer, default=0)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    date_vente: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="pieces")
    client: Mapped[Client | None] = relationship(back_populates="ventes_pieces")


TYPES_DEMANDE = ("voiture", "piece")
STATUTS_DEMANDE = ("demande", "confirmee", "annulee")


class Demande(Base):
    """La demande venue de la page publique : une voiture ou une pièce.

    Le client écrit sans compte. Le garage confirme ou annule - la
    vente se consigne ensuite comme d'habitude.
    """

    __tablename__ = "demandes"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    type: Mapped[str] = mapped_column(String(12), default="voiture")
    voiture_id: Mapped[int | None] = mapped_column(ForeignKey("voitures.id"), nullable=True)
    piece_id: Mapped[int | None] = mapped_column(ForeignKey("pieces.id"), nullable=True)
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(12), default="demande", index=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    traite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organisation: Mapped[Organisation] = relationship()
    voiture: Mapped[Voiture | None] = relationship(lazy="joined")
    piece: Mapped[Piece | None] = relationship(lazy="joined")
