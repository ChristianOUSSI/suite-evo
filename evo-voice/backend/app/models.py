from __future__ import annotations

"""La dictée et la commande vocale : ce qui a été dit, ce que ça veut dire.

On parle au téléphone, la machine transcrit (en démo, on tape ce qui a été
dit), l'intention est devinée par des règles simples, puis exécutée ici -
rien ne part sur le réseau : ni SMS, ni appel, ni message.
"""

from datetime import date as date_type, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


def _maintenant_naif():
    return maintenant()


ROLES = ("responsable", "agent")
INTENTIONS = ("rappel", "message", "note", "recherche", "alerte", "autre")
STATUTS_COMMANDE = ("recue", "interpretee", "executee", "echec", "annulee")


class Organisation(Base):
    """L'organisation qui parle à la machine."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    commandes: Mapped[list[CommandeVocale]] = relationship(
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


class CommandeVocale(Base):
    """Une commande dite : la transcription, l'intention, le statut, le résultat."""

    __tablename__ = "commandes_vocales"
    __table_args__ = (
        Index("ix_commandes_statut", "statut"),
        Index("ix_commandes_intention", "intention"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    transcription: Mapped[str] = mapped_column(Text)
    intention: Mapped[str] = mapped_column(String(16), default="")
    statut: Mapped[str] = mapped_column(String(12), default="recue")
    resultat: Mapped[str] = mapped_column(Text, default="")
    auteur: Mapped[str] = mapped_column(String(120), default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    maj_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif, onupdate=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="commandes")
