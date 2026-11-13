from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .utils import maintenant


class Boutique(Base):
    """Le comptoir : une boutique, son tenancier, ses rails et son abonnement hebdomadaire."""

    __tablename__ = "boutiques"

    id: Mapped[int] = mapped_column(primary_key=True)
    nom: Mapped[str] = mapped_column(String(160))
    enseigne: Mapped[str] = mapped_column(String(40), default="")
    quartier: Mapped[str] = mapped_column(String(80), default="")
    ville: Mapped[str] = mapped_column(String(60), default="Douala")
    tenancier: Mapped[str] = mapped_column(String(80), default="")
    telephone: Mapped[str] = mapped_column(String(24), default="")
    abonnement_hebdo: Mapped[int] = mapped_column(Integer, default=3_000)
    devise: Mapped[str] = mapped_column(String(8), default="FCFA")
    especes_actifs: Mapped[bool] = mapped_column(Boolean, default=True)
    momo_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    orange_actif: Mapped[bool] = mapped_column(Boolean, default=True)
    credit_accorde: Mapped[bool] = mapped_column(
        Boolean, default=False, comment="Vendre à crédit reste-t-il possible au comptoir"
    )
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    mains: Mapped[list[Main]] = relationship(back_populates="boutique")
    produits: Mapped[list[Produit]] = relationship(
        back_populates="boutique", cascade="all, delete-orphan"
    )
    ventes: Mapped[list[Vente]] = relationship(back_populates="boutique")
    entrees: Mapped[list[Entree]] = relationship(back_populates="boutique")
    depenses: Mapped[list[Depense]] = relationship(back_populates="boutique")
    comptages: Mapped[list[Comptage]] = relationship(back_populates="boutique")


class Main(Base):
    """Une main au comptoir : le tenancier, la vendeuse, le livreur."""

    __tablename__ = "mains"
    __table_args__ = (UniqueConstraint("email", name="uq_main_email"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    boutique_id: Mapped[int] = mapped_column(ForeignKey("boutiques.id"))
    nom: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160))
    mot_de_passe: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(24), default="tenancier")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    boutique: Mapped[Boutique] = relationship(back_populates="mains")


class Produit(Base):
    """La ligne du cahier : ce que la boutique revend, à quel prix et en quelle unité."""

    __tablename__ = "produits"
    __table_args__ = (
        UniqueConstraint("boutique_id", "nom", "categorie", name="uq_produit_nom"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    boutique_id: Mapped[int] = mapped_column(ForeignKey("boutiques.id"))
    nom: Mapped[str] = mapped_column(String(120))
    categorie: Mapped[str] = mapped_column(String(60), default="fourre-tout")
    unite: Mapped[str] = mapped_column(String(16), default="pièce")
    prix_achat: Mapped[int] = mapped_column(Integer, default=0)
    prix_vente: Mapped[int] = mapped_column(Integer, default=0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    alerte_stock: Mapped[int] = mapped_column(Integer, default=5)
    mots_cles: Mapped[str] = mapped_column(
        String(240), default="", comment="Les mots que la voix dit pour cet article"
    )
    actif: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    boutique: Mapped[Boutique] = relationship(back_populates="produits")
    ventes: Mapped[list[Vente]] = relationship(back_populates="produit")
    entrees: Mapped[list[Entree]] = relationship(
        back_populates="produit", cascade="all, delete-orphan"
    )


class Entree(Base):
    """Le rachat : ce qui rentre en réserve, à quel coût, noté par qui."""

    __tablename__ = "entrees"

    id: Mapped[int] = mapped_column(primary_key=True)
    boutique_id: Mapped[int] = mapped_column(ForeignKey("boutiques.id"))
    produit_id: Mapped[int] = mapped_column(ForeignKey("produits.id"))
    quantite: Mapped[int] = mapped_column(Integer)
    cout_unitaire: Mapped[int] = mapped_column(Integer)
    jour: Mapped[date] = mapped_column(Date, default=date.today)
    moment: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    fournisseur: Mapped[str] = mapped_column(String(120), default="")
    note: Mapped[str] = mapped_column(String(400), default="")
    dictee: Mapped[bool] = mapped_column(Boolean, default=False)
    brut: Mapped[str] = mapped_column(String(600), default="")
    tenu_par_id: Mapped[int] = mapped_column(ForeignKey("mains.id"))

    boutique: Mapped[Boutique] = relationship(back_populates="entrees")
    produit: Mapped[Produit] = relationship(back_populates="entrees")
    tenu_par: Mapped[Main] = relationship()


class Vente(Base):
    """Ce qui sort du comptoir. Le coût est figé à la vente, pour que le bénéfice ne bouge plus."""

    __tablename__ = "ventes"

    id: Mapped[int] = mapped_column(primary_key=True)
    boutique_id: Mapped[int] = mapped_column(ForeignKey("boutiques.id"))
    produit_id: Mapped[int] = mapped_column(ForeignKey("produits.id"))
    quantite: Mapped[int] = mapped_column(Integer)
    prix_cede: Mapped[int] = mapped_column(Integer)
    cout_unitaire: Mapped[int] = mapped_column(Integer)
    mode: Mapped[str] = mapped_column(String(16), default="especes")
    jour: Mapped[date] = mapped_column(Date, default=date.today)
    moment: Mapped[datetime] = mapped_column(DateTime, default=maintenant)
    reference: Mapped[str] = mapped_column(String(12), default="")
    dictee: Mapped[bool] = mapped_column(Boolean, default=False)
    brut: Mapped[str] = mapped_column(String(600), default="")
    annule: Mapped[bool] = mapped_column(Boolean, default=False)
    motif_annulation: Mapped[str] = mapped_column(String(160), default="")
    tenu_par_id: Mapped[int] = mapped_column(ForeignKey("mains.id"))

    boutique: Mapped[Boutique] = relationship(back_populates="ventes")
    produit: Mapped[Produit] = relationship(back_populates="ventes")
    tenu_par: Mapped[Main] = relationship()


class Depense(Base):
    """L'argent qui sort sans vendre : transport, loyer, salaire, facture."""

    __tablename__ = "depenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    boutique_id: Mapped[int] = mapped_column(ForeignKey("boutiques.id"))
    libelle: Mapped[str] = mapped_column(String(160))
    categorie: Mapped[str] = mapped_column(String(40), default="autre")
    montant: Mapped[int] = mapped_column(Integer)
    jour: Mapped[date] = mapped_column(Date, default=date.today)
    note: Mapped[str] = mapped_column(String(400), default="")

    boutique: Mapped[Boutique] = relationship(back_populates="depenses")


class Comptage(Base):
    """Le tiroir compté le soir : le fond attendu, l'argent trouvé, l'écart assumé."""

    __tablename__ = "comptages"
    __table_args__ = (UniqueConstraint("boutique_id", "jour", name="uq_comptage_jour"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    boutique_id: Mapped[int] = mapped_column(ForeignKey("boutiques.id"))
    jour: Mapped[date] = mapped_column(Date, default=date.today)
    fond: Mapped[int] = mapped_column(Integer, default=0)
    compte: Mapped[int] = mapped_column(Integer, default=0)
    attendu: Mapped[int] = mapped_column(Integer, default=0)
    note: Mapped[str] = mapped_column(String(400), default="")
    tenu_par_id: Mapped[int] = mapped_column(ForeignKey("mains.id"))
    moment: Mapped[datetime] = mapped_column(DateTime, default=maintenant)

    boutique: Mapped[Boutique] = relationship(back_populates="comptages")
    tenu_par: Mapped[Main] = relationship()
