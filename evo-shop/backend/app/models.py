from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif() -> datetime:
    """Une horodatée naïve en UTC : `datetime.utcnow` est déprécié."""
    return maintenant()

# Point de vente : la boutique, ses produits, ses tickets.
# Le stock baisse à la vente, il remonte à l'annulation - jamais à l'édition
# d'un prix. Le prix de vente du jour fait foi, l'historique garde l'instantané.

UNITES = ("piece", "sac", "kg", "litre", "carton", "paquet")
STATUTS_VENTE = ("validee", "annulee")
ROLES = ("responsable", "caissier")


class Organisation(Base):
    """La boutique qui tient la caisse."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    produits: Mapped[list[Produit]] = relationship(
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
    role: Mapped[str] = mapped_column(String(16), default="caissier")

    organisation: Mapped[Organisation] = relationship(back_populates="users")


class Produit(Base):
    """Un article de la boutique : prix d'achat, prix de vente, stock."""

    __tablename__ = "produits"

    __table_args__ = (
        Index(
            "uq_produit_nom",
            "organisation_id",
            "nom",
            unique=True,
            sqlite_where=text("nom <> ''"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    nom: Mapped[str] = mapped_column(String(160))
    unite: Mapped[str] = mapped_column(String(12), default="piece")
    prix_achat: Mapped[int] = mapped_column(Integer, default=0)
    prix_vente: Mapped[int] = mapped_column(Integer, default=0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    seuil_alerte: Mapped[int] = mapped_column(Integer, default=0)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    note: Mapped[str] = mapped_column(Text, default="")

    organisation: Mapped[Organisation] = relationship(back_populates="produits")
    lignes: Mapped[list[LigneVente]] = relationship(
        back_populates="produit", cascade="all", lazy="selectin"
    )


class Vente(Base):
    """Un ticket de caisse : ses lignes, son total, son instantané."""

    __tablename__ = "ventes"

    __table_args__ = (
        Index("ix_vente_statut", "statut"),
        Index("ix_vente_creee_le", "cree_le"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    total: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="validee", index=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    cree_le: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: _maintenant_naif()
    )

    organisation: Mapped[Organisation] = relationship()
    auteur: Mapped[User | None] = relationship("User", lazy="joined")
    lignes: Mapped[list[LigneVente]] = relationship(
        back_populates="vente", cascade="all", lazy="selectin"
    )


class LigneVente(Base):
    """Une ligne de ticket : produit, quantité, prix unitaire figé à l'instant."""

    __tablename__ = "lignes_vente"

    id: Mapped[int] = mapped_column(primary_key=True)
    vente_id: Mapped[int] = mapped_column(ForeignKey("ventes.id"), index=True)
    produit_id: Mapped[int] = mapped_column(ForeignKey("produits.id"))
    quantite: Mapped[int] = mapped_column(Integer, default=1)
    prix_unitaire: Mapped[int] = mapped_column(Integer, default=0)

    vente: Mapped[Vente] = relationship(back_populates="lignes", lazy="joined")
    produit: Mapped[Produit] = relationship(back_populates="lignes", lazy="joined")
