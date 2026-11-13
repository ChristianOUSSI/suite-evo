from __future__ import annotations

"""Le standard du centre d'appels : les appels et la file.

Trois règles :

1. Un appel entre en file, un agent le prend, le termine ou le rend.
   Le statut se change d'un geste ; le passé ne se réécrit pas.
2. La durée se compte en secondes et se lit en minutes : c'est ce que le
   client a vraiment attendu et parlé.
3. Un rappel n'est pas un appel perdu : il porte sa date et revient en
   file le jour venu.
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
SENS = ("entrant", "sortant")
MOTIFS = ("vente", "sav", "renseignement", "plainte", "rappel", "prospection", "autre")
STATUTS = ("en_file", "en_cours", "termine", "sans_reponse", "rappel", "annule")


class Organisation(Base):
    """Le centre d'appels qui tient la file."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    appels: Mapped[list[Appel]] = relationship(
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


class Appel(Base):
    """Un appel : le client, le sens, le motif, le statut, la durée."""

    __tablename__ = "appels"
    __table_args__ = (
        Index("ix_appels_statut", "statut"),
        Index("ix_appels_date", "date"),
        Index("ix_appels_agent", "agent_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    sens: Mapped[str] = mapped_column(String(10), default="entrant")
    motif: Mapped[str] = mapped_column(String(20), default="autre")
    statut: Mapped[str] = mapped_column(String(16), default="en_file")
    agent_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    duree_secondes: Mapped[int] = mapped_column(Integer, default=0)
    date: Mapped[date_type] = mapped_column(Date, default=aujourdhui_defaut)
    heure_appel: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    date_rappel: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_par: Mapped[int] = mapped_column(ForeignKey("users.id"))
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="appels")
    agent: Mapped[User | None] = relationship(foreign_keys=[agent_id])
    auteur: Mapped[User] = relationship(foreign_keys=[cree_par])
