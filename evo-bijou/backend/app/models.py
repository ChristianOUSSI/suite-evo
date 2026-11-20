from __future__ import annotations

"""La vitrine de la bijouterie : les pièces et les clients.

Trois règles :

1. Une pièce entre en vitrine, se réserve, se vend, se retire.
   Le statut se change d'un geste ; le passé ne se réécrit pas.
2. Une pièce vendue garde son client, son prix de vente et sa date :
   la vente est une date, pas un commentaire.
3. Le catalogue public ne montre que ce qui est en vitrine -
   ni l'acheteur, ni les clients, ni le prix d'achat.
"""

from datetime import date as date_type, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


def aujourdhui_defaut() -> date_type:
    from .utils import aujourdhui

    return aujourdhui()


ROLES = ("responsable", "agent")
MATIERES = ("or", "argent", "plaque_or", "acier", "perle", "autre")
STATUTS_PIECE = ("en_vitrine", "reserve", "vendu", "retire")
TYPES_CLIENT = ("particulier", "entreprise", "collectionneur")


class Organisation(Base):
    """La bijouterie qui tient la vitrine."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

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
    """Un acheteur ou un collectionneur : le nom, le numéro, le type."""

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
    pieces: Mapped[list[Piece]] = relationship(back_populates="client")


class Piece(Base):
    """Une pièce de la vitrine : la fiche, le prix, le statut, la vente."""

    __tablename__ = "pieces"
    __table_args__ = (
        UniqueConstraint("reference", name="uq_pieces_reference"),
        Index("ix_pieces_statut", "statut"),
        Index("ix_pieces_matiere", "matiere"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    reference: Mapped[str] = mapped_column(String(16))
    nom: Mapped[str] = mapped_column(String(160))
    matiere: Mapped[str] = mapped_column(String(16), default="or")
    poids_grammes: Mapped[float] = mapped_column(Float, default=0.0)
    carat: Mapped[int | None] = mapped_column(Integer, nullable=True)
    prix_achat: Mapped[int] = mapped_column(Integer, default=0)
    prix_vente: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="en_vitrine")
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    date_vente: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    fournisseur: Mapped[str] = mapped_column(String(120), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="pieces")
    client: Mapped[Client | None] = relationship(back_populates="pieces")


STATUTS_DEMANDE = ("demande", "confirmee", "annulee")


class Demande(Base):
    """La demande de réservation venue de la page publique.

    Le client écrit sans compte : quelle pièce, son nom, son numéro,
    une note. La bijouterie confirme ou annule - la vente se consigne
    ensuite comme d'habitude.
    """

    __tablename__ = "demandes"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    piece_id: Mapped[int | None] = mapped_column(ForeignKey("pieces.id"), nullable=True)
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(12), default="demande", index=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    traite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organisation: Mapped[Organisation] = relationship()
    piece: Mapped[Piece | None] = relationship(lazy="joined")
