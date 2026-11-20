from __future__ import annotations

"""L'atelier et la vente : les motos et les réparations.

Deux règles :

1. Une moto entre en vente, se réserve, se vend, se retire.
   Le statut se change d'un geste ; le passé ne se réécrit pas.
2. Une réparation naît reçue, passe en cours, se termine, se livre.
   Chaque geste porte sa date ; la facture garde le client.
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
STATUTS_MOTO = ("en_vente", "reserve", "vendu", "retire")
STATUTS_REPARATION = ("recue", "en_cours", "terminee", "livree")
TYPES_CLIENT = ("particulier", "entreprise", "livreur")


class Organisation(Base):
    """Le garage qui tient la vente et l'atelier."""

    __tablename__ = "organisations"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")

    motos: Mapped[list[Moto]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    clients: Mapped[list[Client]] = relationship(
        back_populates="organisation", cascade="all, delete-orphan"
    )
    reparations: Mapped[list[Reparation]] = relationship(
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
    """Un acheteur ou un propriétaire de moto : le nom, le numéro, le type."""

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
    motos: Mapped[list[Moto]] = relationship(back_populates="client")
    reparations: Mapped[list[Reparation]] = relationship(back_populates="client")


class Moto(Base):
    """Une moto en vente : la fiche, le prix, le statut, la vente."""

    __tablename__ = "motos"
    __table_args__ = (
        Index("ix_motos_statut", "statut"),
        Index("ix_motos_marque", "marque"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    marque: Mapped[str] = mapped_column(String(60))
    modele: Mapped[str] = mapped_column(String(80))
    annee: Mapped[int] = mapped_column(Integer)
    kilometrage: Mapped[int] = mapped_column(Integer, default=0)
    couleur: Mapped[str] = mapped_column(String(40), default="")
    prix: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="en_vente")
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    date_vente: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="motos")
    client: Mapped[Client | None] = relationship(back_populates="motos")
    reparations: Mapped[list[Reparation]] = relationship(back_populates="moto")


class Reparation(Base):
    """Une réparation ou un entretien : le client, la panne, le prix."""

    __tablename__ = "reparations"
    __table_args__ = (
        Index("ix_reparations_statut", "statut"),
        Index("ix_reparations_client", "client_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"))
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"))
    moto_id: Mapped[int | None] = mapped_column(ForeignKey("motos.id"), nullable=True)
    immatriculation: Mapped[str] = mapped_column(String(20), default="")
    panne: Mapped[str] = mapped_column(String(160))
    travaux: Mapped[str] = mapped_column(Text, default="")
    cout_main_oeuvre: Mapped[int] = mapped_column(Integer, default=0)
    cout_pieces: Mapped[int] = mapped_column(Integer, default=0)
    statut: Mapped[str] = mapped_column(String(12), default="recue")
    date_reception: Mapped[date_type] = mapped_column(Date)
    date_livraison: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)

    organisation: Mapped[Organisation] = relationship(back_populates="reparations")
    client: Mapped[Client] = relationship(back_populates="reparations")
    moto: Mapped[Moto | None] = relationship(back_populates="reparations")


TYPES_DEMANDE = ("moto", "reparation")
STATUTS_DEMANDE = ("demande", "confirmee", "annulee")


class Demande(Base):
    """La demande venue de la page publique : une moto ou une réparation.

    Le client écrit sans compte. Le garage confirme ou annule - la
    vente ou la réparation se consigne ensuite comme d'habitude.
    """

    __tablename__ = "demandes"

    id: Mapped[int] = mapped_column(primary_key=True)
    organisation_id: Mapped[int] = mapped_column(ForeignKey("organisations.id"), index=True)
    type: Mapped[str] = mapped_column(String(12), default="moto")
    moto_id: Mapped[int | None] = mapped_column(ForeignKey("motos.id"), nullable=True)
    client_nom: Mapped[str] = mapped_column(String(160), default="")
    client_telephone: Mapped[str] = mapped_column(String(24), default="")
    description: Mapped[str] = mapped_column(String(400), default="")
    note: Mapped[str] = mapped_column(Text, default="")
    statut: Mapped[str] = mapped_column(String(12), default="demande", index=True)
    cree_le: Mapped[datetime] = mapped_column(DateTime, default=_maintenant_naif)
    traite_le: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    organisation: Mapped[Organisation] = relationship()
    moto: Mapped[Moto | None] = relationship(lazy="joined")
