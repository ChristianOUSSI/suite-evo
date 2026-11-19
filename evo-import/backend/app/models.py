from __future__ import annotations

"""Le quai du transitaire : les envois et leur suivi.

Trois règles :

1. Un envoi a un numéro de suivi à dix signes : c'est lui que le
   destinataire tape pour lire où est son colis, sans compte.
2. Le statut avance d'un geste ; chaque passage laisse une ligne
   dans le suivi - le passé ne se réécrit pas.
3. La valeur déclarée et les frais sont en FCFA : c'est ce que la
   douane et le client comptent.
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
MODES = ("maritime", "aerien", "terrestre", "express")
STATUTS_ENVOI = ("en_attente", "en_transit", "en_douane", "livre", "bloque", "annule")
TYPES_CLIENT = ("particulier", "entreprise", "revendeur")


class Organisation(Base):
    """Le transitaire qui tient le quai."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    envois: Mapped[list[Envoi]] = relationship(
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
    """L'expéditeur ou le destinataire : le nom, le numéro."""

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


class Envoi(Base):
    """Un envoi : le suivi, les deux bouts, le poids, la valeur, les frais."""

    __tablename__ = "envois"
    __table_args__ = (
        UniqueConstraint("numero_suivi", name="uq_envois_numero"),
        Index("ix_envois_statut", "statut"),
        Index("ix_envois_date", "date_envoi"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    numero_suivi: Mapped[str] = mapped_column(String(12))
    description: Mapped[str] = mapped_column(String(200))
    mode: Mapped[str] = mapped_column(String(12), default="maritime")
    expéditeur_nom: Mapped[str] = mapped_column(String(160), default="")
    expéditeur_pays: Mapped[str] = mapped_column(String(60), default="")
    destinataire_nom: Mapped[str] = mapped_column(String(160), default="")
    destinataire_ville: Mapped[str] = mapped_column(String(80), default="")
    poids_kg: Mapped[float] = mapped_column(default=0.0)
    valeur_declaree: Mapped[int] = mapped_column(Integer, default=0)
    frais: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="en_attente")
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    date_envoi: Mapped[date_type] = mapped_column(Date, default=aujourdhui_defaut)
    date_livraison: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="envois")
    client: Mapped[Client | None] = relationship()
    suivi: Mapped[list[Suivi]] = relationship(
        back_populates="envoi", cascade="all, delete-orphan", order_by="Suivi.cree_le"
    )


class Suivi(Base):
    """Une ligne du parcours : le statut atteint, le jour, la note."""

    __tablename__ = "suivis"
    __table_args__ = (Index("ix_suivis_envoi", "envoi_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    envoi_id: Mapped[int] = mapped_column(ForeignKey("envois.id"))
    statut: Mapped[str] = mapped_column(String(12))
    note: Mapped[str] = mapped_column(String(300), default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    envoi: Mapped[Envoi] = relationship(back_populates="suivi")
