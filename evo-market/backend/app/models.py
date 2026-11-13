from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
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


def aujourdhui_defaut() -> date:
    from .utils import aujourdhui

    return aujourdhui()

# La boutique : ses annonces, ses vendeurs, ses commandes.
# Une annonce a un prix et un stock ; une commande a un acheteur, un moyen
# de paiement et un statut. Le statut de la commande avance à la main —
# nouvelle, confirmée, livrée, annulée — et le passé ne s'efface pas.

ROLES = ("responsable", "agent")
CATEGORIES = ("alimentation", "vetements", "electronique", "maison", "beaute", "telephone", "auto", "autre")
STATUTS_ANNONCE = ("en_ligne", "vendu", "retire")
STATUTS_COMMANDE = ("nouvelle", "confirmee", "livree", "annulee")
MOYENS = ("especes", "mtn_money", "orange_money", "nexttel_money", "virement", "autre")


class Organisation(Base):
    """La boutique qui tient le registre des annonces."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    annonces: Mapped[list[Annonce]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    commandes: Mapped[list[Commande]] = relationship(
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


class Annonce(Base):
    """Une annonce de vente : l'article, le prix, le stock, le vendeur."""

    __tablename__ = "annonces"
    __table_args__ = (
        Index("ix_annonces_statut", "statut"),
        Index("ix_annonces_categorie", "categorie"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    titre: Mapped[str] = mapped_column(String(200))
    categorie: Mapped[str] = mapped_column(String(20), default="autre")
    description: Mapped[str] = mapped_column(Text, default="")
    prix: Mapped[int] = mapped_column(Integer, default=0)
    stock: Mapped[int] = mapped_column(Integer, default=1)
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    statut: Mapped[str] = mapped_column(String(16), default="en_ligne")
    vendeur_nom: Mapped[str] = mapped_column(String(160), default="")
    vendeur_telephone: Mapped[str] = mapped_column(String(24), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="annonces")
    commandes_liste: Mapped[list[Commande]] = relationship(
        back_populates="annonce", cascade="all, delete-orphan"
    )


class Commande(Base):
    """Une commande : l'annonce, l'acheteur, le montant, le statut."""

    __tablename__ = "commandes"
    __table_args__ = (
        Index("ix_commandes_statut", "statut"),
        Index("ix_commandes_date", "date"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    annonce_id: Mapped[int] = mapped_column(ForeignKey("annonces.id"))
    quantite: Mapped[int] = mapped_column(Integer, default=1)
    montant: Mapped[int] = mapped_column(Integer, default=0)
    acheteur_nom: Mapped[str] = mapped_column(String(160), default="")
    acheteur_telephone: Mapped[str] = mapped_column(String(24), default="")
    moyen: Mapped[str] = mapped_column(String(20), default="especes")
    statut: Mapped[str] = mapped_column(String(16), default="nouvelle")
    date: Mapped[date] = mapped_column(Date, default=aujourdhui_defaut)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="commandes")
    annonce: Mapped[Annonce] = relationship(back_populates="commandes_liste")
    auteur: Mapped[User] = relationship(foreign_keys=[cree_par])
