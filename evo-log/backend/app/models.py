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

# Le transporteur : ses colis, ses agents, ses expéditeurs.
# Chaque colis porte un numéro de suivi à dix signes, lisible par le
# destinataire sans compte. Le statut avance à la main - reçu, en transit,
# arrivé, distribué, retourné - et le passé ne se réécrit pas.

ROLES = ("responsable", "agent")
GENRES = ("document", "colis", "valise", "electromenager", "palette", "autre")
STATUTS = ("recu", "en_transit", "arrive", "distribue", "retourne", "annule")
MOYENS = ("especes", "mtn_money", "orange_money", "nexttel_money", "virement", "a_payer", "autre")
VILLES = ("Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Bertoua", "Ebolowa", "Kribi", "Limbe", "Buea")


class Organisation(Base):
    """Le transporteur qui tient le registre des colis."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    colis: Mapped[list[Colis]] = relationship(
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


class Colis(Base):
    """Un envoi : qui l'envoie, qui le reçoit, par où, combien, où il en est."""

    __tablename__ = "colis"
    __table_args__ = (
        UniqueConstraint("numero", name="uq_colis_numero"),
        Index("ix_colis_statut", "statut"),
        Index("ix_colis_date_depot", "date_depot"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    numero: Mapped[str] = mapped_column(String(12))
    genre: Mapped[str] = mapped_column(String(20), default="colis")
    description: Mapped[str] = mapped_column(Text, default="")
    poids_kg: Mapped[int] = mapped_column(Integer, default=0)

    expediteur_nom: Mapped[str] = mapped_column(String(160), default="")
    expediteur_telephone: Mapped[str] = mapped_column(String(24), default="")

    destinataire_nom: Mapped[str] = mapped_column(String(160), default="")
    destinataire_telephone: Mapped[str] = mapped_column(String(24), default="")

    depart: Mapped[str] = mapped_column(String(60), default="Douala")
    arrivee: Mapped[str] = mapped_column(String(60), default="Douala")

    frais: Mapped[int] = mapped_column(Integer, default=0)
    moyen: Mapped[str] = mapped_column(String(20), default="a_payer")

    statut: Mapped[str] = mapped_column(String(16), default="recu")
    date_depot: Mapped[date] = mapped_column(Date, default=aujourdhui_defaut)
    date_livraison: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")

    agent_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cree_par: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="colis")
    agent: Mapped[User] = relationship(foreign_keys=[agent_id])
    auteur: Mapped[User] = relationship(foreign_keys=[cree_par])
