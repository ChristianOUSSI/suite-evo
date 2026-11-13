import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyPublicLink } from "@/components/copy-public-link";
import { InvoiceTools } from "@/components/invoice-tools";
import { apiGet } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import {
  dateTime,
  daysWord,
  fcfa,
  isoToday,
  longDate,
  shortDate,
} from "@/lib/format";
import { requireSession } from "@/lib/session";
import type { InvoiceDetail, Reminder } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dossier de créance",
};

const REMINDER_STATUS: Record<string, string> = {
  planned: "Programmée",
  sent: "Envoyée",
  cancelled: "Suspendue",
  failed: "Échec",
};

const PROMISE_STATUS: Record<string, string> = {
  active: "En cours",
  kept: "Tenue",
  broken: "Non tenue",
  cancelled: "Annulée",
};

type PageProps = {
  params: Promise<{ reference: string }>;
};

function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular;
}

function ReminderList({
  items,
  upcoming = false,
}: {
  items: Reminder[];
  upcoming?: boolean;
}) {
  return (
    <ol className="dispatch__list">
      {items.map((reminder) => {
        const moment = upcoming
          ? reminder.scheduled_on === isoToday()
            ? "Aujourd’hui"
            : longDate(reminder.scheduled_on)
          : reminder.sent_at
            ? dateTime(reminder.sent_at)
            : longDate(reminder.scheduled_on);
        return (
          <li
            key={reminder.id}
            className={`dispatch__item is-${reminder.status}`}
          >
            <span className="dispatch__dot" aria-hidden="true" />
            <div className="dispatch__when">
              <span>{moment}</span>
              <small>{reminder.channel_label}</small>
            </div>
            <div className="dispatch__body">
              <div className="dispatch__line">
                <strong>{reminder.step_label}</strong>
                <span
                  className={`status-mark status-mark--${reminder.status}`}
                >
                  {REMINDER_STATUS[reminder.status] ?? reminder.status}
                </span>
              </div>
              <p>{reminder.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default async function InvoiceDossierPage({ params }: PageProps) {
  const { reference } = await params;
  const session = await requireSession();

  let invoice: InvoiceDetail;
  try {
    invoice = await apiGet<InvoiceDetail>(
      `/invoices/${encodeURIComponent(reference)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const merchant = session.merchant;
  const planned = invoice.reminders
    .filter((reminder) => reminder.status === "planned")
    .sort(
      (a, b) =>
        a.scheduled_on.localeCompare(b.scheduled_on) || a.id - b.id,
    );
  const history = invoice.reminders.filter(
    (reminder) => reminder.status !== "planned",
  );
  const activePromise = invoice.promises.find(
    (promise) => promise.status === "active",
  );
  const whatsappNumber = invoice.customer.phone.replace(/\D/g, "");

  const stateNote =
    invoice.days_late > 0
      ? `${daysWord(invoice.days_late)} de retard`
      : activePromise
        ? `Promesse le ${shortDate(activePromise.promised_on)}`
        : `Échéance le ${shortDate(invoice.due_on)}`;

  return (
    <div className="shell dossier">
      <nav className="crumbs" aria-label="Fil du carnet">
        <Link href="/app">Journal</Link>
        <span aria-hidden="true">/</span>
        <Link href="/app/creances">Créances</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{invoice.reference}</span>
      </nav>

      <header className="dossier-head">
        <div>
          <span className="kicker">Dossier {invoice.reference}</span>
          <h1>{invoice.customer.name}</h1>
          <p className="dossier-head__label">{invoice.label}</p>
          <div className="dossier-head__meta">
            <span>Émise le {shortDate(invoice.issued_on)}</span>
            <span>Échéance {shortDate(invoice.due_on)}</span>
            <span>{invoice.customer.quartier || "Quartier non renseigné"}</span>
          </div>
        </div>
        <div
          className={`dossier-head__amount${
            invoice.days_late > 0 && invoice.status === "open"
              ? " is-late"
              : ""
          }`}
        >
          <span className="eyebrow">Solde dû</span>
          <strong>{fcfa(invoice.remaining)}</strong>
          <span className="dossier-head__paid">
            {fcfa(invoice.amount_paid)} réglés sur {fcfa(invoice.amount_due)}
          </span>
          <div className="dossier-head__state">
            <span className={`tag tag--${invoice.stage}`}>
              {invoice.stage_label}
            </span>
            <span>{stateNote}</span>
          </div>
        </div>
      </header>

      <div className="dossier-grid">
        <div className="dossier-main">
          <article
            className={`invoice-sheet${
              invoice.status !== "open" ? " is-closed" : ""
            }`}
          >
            {invoice.status === "paid" && (
              <span className="invoice-sheet__watermark" aria-hidden="true">
                Réglé
              </span>
            )}
            {invoice.status === "disputed" && (
              <span className="invoice-sheet__watermark" aria-hidden="true">
                Litige
              </span>
            )}

            <div className="invoice-sheet__top">
              <div className="invoice-sheet__issuer">
                <span className="invoice-sheet__brand">{merchant.name}</span>
                <span>
                  {merchant.quartier}, {merchant.city}
                </span>
                <span>{merchant.phone_display}</span>
              </div>
              <div className="invoice-sheet__doc">
                <span className="invoice-sheet__doctype">
                  Avis de créance
                </span>
                <span className="invoice-sheet__ref money">
                  {invoice.reference}
                </span>
              </div>
            </div>

            <div className="invoice-sheet__rule" />

            <div className="invoice-sheet__parties">
              <div>
                <span className="eyebrow">Client</span>
                <strong>{invoice.customer.name}</strong>
                <span>{invoice.customer.phone_display}</span>
                <span>
                  {invoice.customer.quartier || "Quartier non renseigné"}
                </span>
              </div>
              <div>
                <span className="eyebrow">Dates</span>
                <span>Émise le {shortDate(invoice.issued_on)}</span>
                <span>Échéance le {shortDate(invoice.due_on)}</span>
              </div>
            </div>

            <div className="invoice-sheet__line">
              <span className="invoice-sheet__line-no">01</span>
              <div>
                <strong>{invoice.label}</strong>
                {invoice.notes && <small>{invoice.notes}</small>}
              </div>
              <span className="money">{fcfa(invoice.amount_due)}</span>
            </div>

            <dl className="invoice-sheet__totals">
              <div>
                <dt>Total facturé</dt>
                <dd>{fcfa(invoice.amount_due)}</dd>
              </div>
              <div>
                <dt>Acomptes reçus</dt>
                <dd>{fcfa(invoice.amount_paid)}</dd>
              </div>
              <div className="invoice-sheet__balance">
                <dt>Solde dû</dt>
                <dd>{fcfa(invoice.remaining)}</dd>
              </div>
            </dl>

            <footer className="invoice-sheet__foot">
              <span>
                Document de suivi interne. Un règlement Mobile Money est
                enregistré avec 3 % de frais de service, portés séparément au
                carnet.
              </span>
              <span className="invoice-sheet__monogram">
                PALABRE · CARNET
              </span>
            </footer>
          </article>

          <section className="dispatch" aria-labelledby="dispatch-title">
            <div className="dispatch__head">
              <div>
                <span className="kicker">La parole</span>
                <h2 id="dispatch-title">Chronique des relances</h2>
              </div>
              <span className="dispatch__count">
                {planned.length} à venir · {history.length} au dossier
              </span>
            </div>

            <div className="dispatch__group">
              <h3 className="dispatch__group-title">Au programme</h3>
              {planned.length > 0 ? (
                <ReminderList items={planned} upcoming />
              ) : (
                <p className="dispatch__empty">
                  {invoice.status === "paid"
                    ? "Dossier réglé : plus aucun message n’est programmé."
                    : invoice.status === "disputed"
                      ? "Relances en pause tant que le litige n’est pas rouvert."
                      : "Aucune relance programmée pour ce dossier."}
                </p>
              )}
            </div>

            <div className="dispatch__group">
              <h3 className="dispatch__group-title">Historique</h3>
              {history.length > 0 ? (
                <ReminderList items={history} />
              ) : (
                <p className="dispatch__empty">
                  Rien n’est encore parti. La première parole reste à écrire.
                </p>
              )}
            </div>
          </section>

          <div className="dossier-ledgers">
            <section className="mini-ledger" aria-labelledby="caisse-title">
              <div className="mini-ledger__head">
                <h2 id="caisse-title">Caisse</h2>
                <span>
                  {invoice.payments.length}{" "}
                  {plural(
                    invoice.payments.length,
                    "reçu",
                    "reçus",
                  )}{" "}
                  · {fcfa(invoice.amount_paid)}
                </span>
              </div>
              {invoice.payments.length === 0 ? (
                <p className="mini-ledger__empty">
                  Aucun règlement consigné sur ce dossier.
                </p>
              ) : (
                <ul className="entry-list">
                  {invoice.payments.map((payment) => (
                    <li className="entry" key={payment.id}>
                      <div className="entry__main">
                        <strong>{payment.method_label}</strong>
                        <small>
                          {dateTime(payment.paid_at)} · {payment.reference}
                          {payment.phone ? ` · ${payment.phone_display}` : ""}
                        </small>
                      </div>
                      <div className="entry__amount">
                        <span className="money">{fcfa(payment.amount)}</span>
                        <span className="entry__fee">
                          frais {fcfa(payment.fee_amount)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mini-ledger" aria-labelledby="promesses-title">
              <div className="mini-ledger__head">
                <h2 id="promesses-title">Promesses</h2>
                <span>
                  {invoice.promises.length}{" "}
                  {plural(invoice.promises.length, "note", "notes")}
                </span>
              </div>
              {invoice.promises.length === 0 ? (
                <p className="mini-ledger__empty">
                  Aucune date donnée par le client.
                </p>
              ) : (
                <ul className="entry-list">
                  {invoice.promises.map((promise) => (
                    <li className="entry" key={promise.id}>
                      <div className="entry__main">
                        <strong>{fcfa(promise.amount)}</strong>
                        <small>
                          Pour le {shortDate(promise.promised_on)} · notée le{" "}
                          {dateTime(promise.created_at)}
                        </small>
                        {promise.note && <p>{promise.note}</p>}
                      </div>
                      <span
                        className={`status-mark status-mark--${promise.status}`}
                      >
                        {PROMISE_STATUS[promise.status] ?? promise.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="dossier-rail">
          <InvoiceTools
            reference={invoice.reference}
            remaining={invoice.remaining}
            status={invoice.status}
            canPay={invoice.can_pay}
            optOut={invoice.customer.opt_out}
            customerPhone={invoice.customer.phone}
          />

          <CopyPublicLink
            token={invoice.public_token}
            reference={invoice.reference}
          />

          <section className="customer-card" aria-labelledby="client-title">
            <span className="kicker kicker--plain">Le client</span>
            <h3 id="client-title">{invoice.customer.name}</h3>
            <dl>
              <div>
                <dt>Téléphone</dt>
                <dd>{invoice.customer.phone_display}</dd>
              </div>
              <div>
                <dt>Quartier</dt>
                <dd>{invoice.customer.quartier || "Non renseigné"}</dd>
              </div>
              <div>
                <dt>Relances</dt>
                <dd>
                  {invoice.customer.opt_out ? "Désinscrit" : "Autorisées"}
                </dd>
              </div>
            </dl>
            <div className="customer-card__actions">
              <a href={`tel:${invoice.customer.phone}`} className="text-link">
                Appeler
              </a>
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
