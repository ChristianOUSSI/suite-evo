import type { Metadata } from "next";
import Link from "next/link";

import { QuickPayment } from "@/components/quick-payment";
import { apiGet } from "@/lib/api";
import { dateTime, fcfa, monthAndYear } from "@/lib/format";
import type {
  Dashboard,
  InvoiceList,
  PaymentFeed,
} from "@/lib/types";

import "../../../../styles/caisse.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Caisse",
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Espèces",
  momo_mtn: "MTN MoMo",
  momo_orange: "Orange Money",
};

const METHOD_ORDER = ["momo_mtn", "momo_orange", "cash"];

export default async function CaissePage() {
  const [feed, dashboard, register] = await Promise.all([
    apiGet<PaymentFeed>("/payments?limit=200"),
    apiGet<Dashboard>("/dashboard"),
    apiGet<InvoiceList>("/invoices"),
  ]);

  const stats = dashboard.stats;
  const totalMethods = feed.items.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const mix = METHOD_ORDER.map((key) => {
    const items = feed.items.filter((payment) => payment.method === key);
    return {
      key,
      label: METHOD_LABELS[key] ?? key,
      count: items.length,
      total: items.reduce((sum, payment) => sum + payment.amount, 0),
    };
  }).filter((entry) => entry.count > 0);

  const quickInvoices = register.items
    .filter((invoice) => invoice.status === "open" && invoice.remaining > 0)
    .map((invoice) => ({
      reference: invoice.reference,
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone,
      remaining: invoice.remaining,
      due_on: invoice.due_on,
    }));

  return (
    <div className="shell caisse">
      <header className="page-head caisse__head">
        <div className="page-head__main">
          <span className="kicker">Feuille 04 · La caisse</span>
          <h1>L’argent reçu, sans trou de mémoire.</h1>
          <p className="page-head__lede">
            {fcfa(stats.collected_month)} sont entrés ce mois.{" "}
            {fcfa(stats.fees_month)} de frais de service sont comptés à part.
            Chaque reçu reste accroché à son dossier, avec son moyen de
            paiement et son heure.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/creances" className="btn">
            Voir les créances
          </Link>
        </div>
      </header>

      <section className="cash-band" aria-label="Chiffres de la caisse">
        <div className="cash-band__cell">
          <span className="eyebrow">Encaissé ce mois</span>
          <p className="cash-band__value">{fcfa(stats.collected_month)}</p>
          <span className="cash-band__note">
            règlements confirmés en {monthAndYear(dashboard.as_of)}
          </span>
        </div>
        <div className="cash-band__cell">
          <span className="eyebrow">Frais de service</span>
          <p className="cash-band__value">{fcfa(stats.fees_month)}</p>
          <span className="cash-band__note">
            3 % sur les règlements du mois
          </span>
        </div>
        <div className="cash-band__cell">
          <span className="eyebrow">Total au carnet</span>
          <p className="cash-band__value">{fcfa(feed.total)}</p>
          <span className="cash-band__note">
            sur les {feed.count} reçus listés
          </span>
        </div>
        <div className="cash-band__cell">
          <span className="eyebrow">Reçus</span>
          <p className="cash-band__value">{feed.count}</p>
          <span className="cash-band__note">
            aucun reçu ne se perd dans un cahier
          </span>
        </div>
      </section>

      <div className="caisse-grid">
        <div className="caisse-main">
          <section className="cashbook" aria-labelledby="cashbook-title">
            <div className="section-head cashbook__head">
              <div>
                <span className="section-head__index">Le registre</span>
                <h2 id="cashbook-title">Les reçus, dans l’ordre.</h2>
              </div>
              <span className="section-head__aside">
                {feed.items.length} ligne
                {feed.items.length > 1 ? "s" : ""}
              </span>
            </div>

            {feed.items.length === 0 ? (
              <div className="empty caisse-empty">
                <span className="kicker kicker--plain">Caisse vide</span>
                <h3>Aucun règlement pour l’instant.</h3>
                <p>
                  Le premier reçu apparaîtra ici, que le paiement se fasse au
                  comptoir ou par le lien Mobile Money du client.
                </p>
                <Link href="/app/creances" className="btn btn--small">
                  Ouvrir une créance
                </Link>
              </div>
            ) : (
              <>
                <div className="cash-ledger">
                  <div className="cash-ledger__head" aria-hidden="true">
                    <span>Date</span>
                    <span>Reçu et dossier</span>
                    <span>Moyen</span>
                    <span>Montant</span>
                  </div>
                  {feed.items.map((payment) => (
                    <Link
                      href={`/app/creances/${payment.invoice_reference}`}
                      className="cash-row"
                      key={payment.id}
                    >
                      <div className="cash-row__when">
                        <span>{dateTime(payment.paid_at)}</span>
                        <small>
                          {payment.phone ? payment.phone_display : "au comptoir"}
                        </small>
                      </div>
                      <div className="cash-row__main">
                        <span className="cash-row__ref">
                          {payment.reference}
                        </span>
                        <strong>{payment.customer_name}</strong>
                        <small>{payment.invoice_reference}</small>
                      </div>
                      <span
                        className={`method-chip method-chip--${payment.method}`}
                      >
                        {payment.method_label}
                      </span>
                      <div className="cash-row__amount">
                        <span className="money">{fcfa(payment.amount)}</span>
                        <small>frais {fcfa(payment.fee_amount)}</small>
                      </div>
                    </Link>
                  ))}
                </div>
                <p className="cashbook__foot">
                  Les frais de service sont enregistrés à part du montant
                  client. Ils n’augmentent jamais le solde d’une créance.
                </p>
              </>
            )}
          </section>
        </div>

        <aside className="caisse-rail" id="comptoir">
          <QuickPayment invoices={quickInvoices} />

          <section className="method-mix" aria-labelledby="method-mix-title">
            <div className="method-mix__head">
              <span className="kicker kicker--plain">D’où vient l’argent</span>
              <span className="eyebrow">Tout le carnet</span>
            </div>
            <h2 id="method-mix-title">La part de chaque moyen.</h2>
            <ul>
              {mix.map((entry) => (
                <li key={entry.key}>
                  <div className="method-mix__line">
                    <span
                      className={`method-dot method-dot--${entry.key}`}
                      aria-hidden="true"
                    />
                    <strong>{entry.label}</strong>
                    <span>
                      {entry.count} reçu{entry.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="method-mix__track">
                    <span
                      style={{
                        width: `${totalMethods > 0 ? Math.max(Math.round((entry.total / totalMethods) * 100), 2) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="method-mix__amount">
                    {fcfa(entry.total)}
                  </span>
                </li>
              ))}
            </ul>
            <p>
              Le Mobile Money reste majoritaire dans les quartiers. Le liquide
              garde sa place au comptoir, et le carnet ne juge pas.
            </p>
          </section>

          <section className="fee-note">
            <span className="eyebrow">La règle</span>
            <h3>Une commission lisible.</h3>
            <p>
              PALABRE retient 3 % sur chaque règlement, affichés séparément sur
              le reçu. Aucun frais caché ne touche le solde du client.
            </p>
            <p>
              L’abonnement Essentiel est facturé à part, chaque mois, sans
              engagement de durée.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
