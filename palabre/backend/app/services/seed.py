from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..models import Customer, Invoice, Merchant, Payment, PromiseToPay, User
from ..security import hash_password
from ..utils import normalize_phone
from .payments import calculate_fee
from .recovery import new_access_token, next_reference, sync_invoice_reminders

DEMO_EMAIL = "patron@nanafils.cm"
DEMO_PASSWORD = "Palabre2026!"


CUSTOMERS = [
    ("Ets Mbappé Bâtir", "6 77 08 41 96", "Bépanda"),
    ("Hôtel Beauséjour", "6 55 23 90 14", "Akwa"),
    ("Ngo & Frères", "6 90 12 55 33", "Deido"),
    ("Chantier Simbock", "6 78 44 10 27", "Simbock"),
    ("Mme Adèle Tchoumi", "6 94 51 62 30", "Makepe"),
    ("École Les Palmiers", "6 71 33 87 05", "Logpom"),
    ("Clinique du Littoral", "6 58 76 40 12", "Bonanjo"),
    ("Ets Kamdem Bois", "6 96 22 74 58", "New Bell"),
    ("Atelier Njo", "6 77 63 09 81", "Ndokotti"),
    ("Mme Fadimatou Bello", "6 99 30 77 24", "Bonabéri"),
    ("Résidence Akwa Nord", "6 55 91 38 46", "Akwa"),
    ("Ets Tchinda", "6 74 82 15 93", "Bépanda"),
]


# client_index, libellé, montant, échéance (jours), payé, jours depuis paiement
INVOICES = [
    (0, "Ciment, fer à béton et tôles pour Bépanda", 850_000, -52, 300_000, 41),
    (1, "Fourniture plomberie pour 12 chambres", 1_200_000, -34, 400_000, 20),
    (2, "Bois coffrage et contreplaqué", 320_000, -22, 0, 0),
    (3, "Fer, gravier et location de pompe", 950_000, -17, 0, 0),
    (4, "Peinture et enduit pour la villa de Makepe", 95_000, -12, 0, 0),
    (5, "Réfection de 8 salles de classe", 480_000, -8, 0, 0),
    (6, "Vitrerie et quincaillerie pour l'aile ouest", 725_000, -4, 0, 0),
    (7, "Planches et chevrons pour l'atelier de New Bell", 180_000, -3, 0, 0),
    (8, "Quincaillerie menuiserie pour 20 portes", 260_000, 0, 0, 0),
    (9, "Carrelage et colle pour le salon à Bonabéri", 75_000, 4, 0, 0),
    (10, "Robinets, receveurs et éviers", 540_000, 10, 200_000, 9),
    (11, "Bardage et accessoires pour l'extension", 390_000, 18, 0, 0),
    (0, "Livraison de tôles bac, commande d'avril", 450_000, -40, 450_000, 35),
    (2, "Commande de bois brut, lot 12", 210_000, -25, 210_000, 22),
    (6, "Vitres blindées pour le bloc technique", 380_000, -15, 380_000, 12),
    (8, "Accessoires de pose, fin de chantier", 125_000, -60, 125_000, 50),
    (3, "Étais et bastaings, litige sur la quantité", 640_000, -28, 0, 0),
    (9, "Colle et joints, petite commande", 45_000, -5, 45_000, 4),
    (0, "Ciment, 200 sacs pour Japoma", 500_000, -70, 500_000, 62),
    (5, "Peinture pour le préau et les couloirs", 300_000, -55, 300_000, 48),
    (1, "Robinetterie pour 30 salles", 650_000, -45, 650_000, 42),
    (4, "Enduit extérieur pour la façade", 120_000, -30, 120_000, 21),
    (11, "Agglos et sable pour la clôture", 90_000, -75, 0, 0),
]

PAID_STATUSES = {12, 13, 14, 15, 17, 18, 19, 20, 21}
DISPUTED_INDEX = 16


def seed_database(db: Session) -> bool:
    existing = db.scalar(select(User).limit(1))
    if existing:
        return False

    today = date.today()
    merchant = Merchant(
        name="Quincaillerie Nana & Fils",
        owner_name="Alphonse Nana",
        phone="+237699142208",
        city="Douala",
        quartier="Mboppi",
        plan="essentiel",
        monthly_target=2_200_000,
        tone="courtois",
        sms_enabled=True,
        whatsapp_enabled=True,
        voice_enabled=True,
        auto_reminders=True,
        daily_report=True,
    )
    db.add(merchant)
    db.flush()

    patron = User(
        merchant_id=merchant.id,
        name="Alphonse Nana",
        email=DEMO_EMAIL,
        password_hash=hash_password(DEMO_PASSWORD),
        role="patron",
    )
    db.add(patron)

    customers: list[Customer] = []
    for name, raw_phone, quartier in CUSTOMERS:
        phone = normalize_phone(raw_phone)
        customer = Customer(
            merchant_id=merchant.id,
            name=name,
            phone=phone or raw_phone,
            quartier=quartier,
            opt_out=False,
        )
        db.add(customer)
        customers.append(customer)
    db.flush()

    invoices: list[Invoice] = []
    for index, (customer_index, label, amount, due_offset, paid, paid_days_ago) in enumerate(
        INVOICES
    ):
        customer = customers[customer_index]
        due_on = today + timedelta(days=due_offset)
        invoice = Invoice(
            merchant_id=merchant.id,
            customer_id=customer.id,
            reference=next_reference(db, merchant, reserved=index),
            label=label,
            amount_due=amount,
            amount_paid=paid,
            issued_on=due_on - timedelta(days=30),
            due_on=due_on,
            status="open",
            access_token=new_access_token(),
        )
        invoice.merchant = merchant
        invoice.customer = customer
        if index in PAID_STATUSES:
            invoice.status = "paid"
        elif index == DISPUTED_INDEX:
            invoice.status = "disputed"
        db.add(invoice)
        invoices.append(invoice)
    db.flush()

    for invoice in invoices:
        sync_invoice_reminders(db, invoice)
    db.flush()

    for invoice in invoices:
        customer = invoice.customer
        for reminder in invoice.reminders:
            if invoice.status in {"paid", "disputed"}:
                reminder.status = "cancelled"
                continue
            if reminder.scheduled_on < today:
                reminder.status = "sent"
                reminder.sent_at = datetime.combine(
                    reminder.scheduled_on, time(9, 14)
                )
                reminder.provider_ref = f"DEMO-{reminder.id:05d}"
            else:
                reminder.status = "planned"

    # Paiements et reçus
    for index, (customer_index, label, amount, due_offset, paid, paid_days_ago) in enumerate(
        INVOICES
    ):
        if paid == 0:
            continue
        invoice = invoices[index]
        paid_at = datetime.combine(today - timedelta(days=paid_days_ago), time(11, 26))
        method = (
            "momo_mtn"
            if index % 2 == 0
            else "momo_orange"
            if index % 3 == 0
            else "cash"
        )
        payment = Payment(
            invoice_id=invoice.id,
            amount=paid,
            fee_amount=calculate_fee(paid),
            method=method,
            reference=f"RCV-SEED-{index + 1:03d}",
            phone=invoice.customer.phone if method != "cash" else "",
            status="confirmed",
            paid_at=paid_at,
        )
        db.add(payment)

    # Promesses de paiement
    db.add_all(
        [
            PromiseToPay(
                invoice_id=invoices[3].id,
                amount=950_000,
                promised_on=today + timedelta(days=2),
                note="Virement annoncé après réception d'un marché.",
                status="active",
                created_at=datetime.combine(today - timedelta(days=1), time(16, 8)),
            ),
            PromiseToPay(
                invoice_id=invoices[5].id,
                amount=480_000,
                promised_on=today,
                note="La comptable passe à la quincaillerie cet après-midi.",
                status="active",
                created_at=datetime.combine(today - timedelta(days=3), time(10, 42)),
            ),
            PromiseToPay(
                invoice_id=invoices[2].id,
                amount=320_000,
                promised_on=today - timedelta(days=5),
                note="Promesse non tenue.",
                status="broken",
                created_at=datetime.combine(today - timedelta(days=12), time(14, 20)),
            ),
        ]
    )

    db.commit()
    return True


def load_demo_invoice(db: Session) -> Invoice | None:
    return db.scalar(
        select(Invoice)
        .options(
            selectinload(Invoice.customer),
            selectinload(Invoice.reminders),
            selectinload(Invoice.payments),
        )
        .order_by(Invoice.due_on.desc())
        .limit(1)
    )


if __name__ == "__main__":
    import argparse

    from ..database import Base, SessionLocal, engine, init_db

    parser = argparse.ArgumentParser(description="Réinitialise les données de PALABRE.")
    parser.add_argument("--reset", action="store_true", help="Efface et recrée la base.")
    args = parser.parse_args()

    if args.reset:
        Base.metadata.drop_all(bind=engine)
    init_db()
    with SessionLocal() as session:
        created = seed_database(session)
        print("Données de démonstration créées." if created else "Base déjà remplie.")
