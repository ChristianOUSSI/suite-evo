import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PalabreMark } from "@/components/brand";
import { PublicPayForm } from "@/components/public-pay-form";
import { apiGet } from "@/lib/api";
import { ApiError } from "@/lib/errors";
import { fcfa, isoToday, longDate } from "@/lib/format";
import type { PublicInvoice } from "@/lib/types";

import "../../../styles/payer.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Avis de paiement",
  description:
    "Consultez le solde d’un avis de paiement et réglez-le par Mobile Money.",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function PayerPage({ params }: Props) {
  const { token } = await params;

  let invoice: PublicInvoice;
  try {
    invoice = await apiGet<PublicInvoice>(`/public/invoices/${token}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const settled = invoice.remaining === 0 || invoice.stage === "paid";
  const disputed = invoice.stage === "disputed";
  const late = invoice.days_late > 0;
  const today = isoToday();

  const stamp = settled
    ? "Compte soldé"
    : disputed
      ? "En litige"
      : invoice.stage === "promise"
        ? "Promesse notée"
        : late
          ? "En retard"
          : "À échoir";

  const stampTone = settled
    ? " stamp--moss"
    : disputed
      ? " stamp--ink"
      : invoice.stage === "promise"
        ? " stamp--gold"
        : "";

  let timing: string;
  if (settled) {
    timing = "Le compte est soldé. Cet avis reste consultable.";
  } else if (disputed) {
    timing =
      "Le commerçant a mis ce dossier en pause. Parlez-lui avant de régler.";
  } else if (invoice.days_late === 1) {
    timing = `L’échéance du ${longDate(invoice.due_on)} était hier.`;
  } else if (invoice.days_late > 1) {
    timing = `L’échéance du ${longDate(invoice.due_on)} est passée depuis ${invoice.days_late} jours.`;
  } else if (invoice.due_on === today) {
    timing = "L’échéance est aujourd’hui.";
  } else {
    timing = `À régler avant le ${longDate(invoice.due_on)}.`;
  }

  const phoneDigits = invoice.merchant_phone_display.replace(/\D/g, "");
  const telHref = phoneDigits.length >= 9 ? `tel:+${phoneDigits}` : null;

  return (
    <div className="garde-page">
      <header className="garde-bar">
        <div className="garde-bar__inner">
          <div className="garde-bar__brand">
            <PalabreMark className="garde-bar__mark" />
            <span className="garde-bar__word">PALABRE</span>
            <span className="garde-bar__kind">Avis de paiement</span>
          </div>
          <span className="garde-bar__demo">Édition de démonstration</span>
        </div>
      </header>

      <main id="contenu" className="garde-main">
        <article className="payer-sheet">
          <aside className="payer-stub" aria-label="Souche de l’avis">
            <span className="payer-stub__kind">Avis de paiement</span>
            <span className="payer-stub__ref">{invoice.reference}</span>
            <div className="payer-stub__amount">
              <span className="garde-eyebrow">Reste à régler</span>
              <span className="payer-stub__value">{fcfa(invoice.remaining)}</span>
            </div>
            <span className="payer-stub__place">
              {invoice.merchant_quartier} · Douala
            </span>
            <span className={`stamp stamp--straight${stampTone}`}>
              {stamp}
            </span>
          </aside>

          <div className="payer-sheet__body">
            <header className="payer-sheet__head">
              <div className="payer-issuer">
                <span className="garde-eyebrow">Émis par</span>
                <span className="payer-issuer__name">
                  {invoice.merchant_name}
                </span>
                <span className="payer-issuer__place">
                  {invoice.merchant_quartier}, Douala
                </span>
              </div>
              <div className="payer-sheet__ref">
                <span className="garde-eyebrow">Référence</span>
                <span>{invoice.reference}</span>
              </div>
            </header>

            <div className="payer-title">
              <h1>Avis de paiement</h1>
              <p>{timing}</p>
            </div>

            <div className="payer-columns">
              <div className="payer-ledger">
                <dl className="payer-facts">
                  <div>
                    <dt>Concerne</dt>
                    <dd>{invoice.customer_name}</dd>
                  </div>
                  <div>
                    <dt>Objet</dt>
                    <dd>{invoice.label}</dd>
                  </div>
                  <div>
                    <dt>Montant initial</dt>
                    <dd className="payer-facts__money">
                      {fcfa(invoice.amount_due)}
                    </dd>
                  </div>
                  {invoice.amount_paid > 0 && (
                    <div>
                      <dt>Déjà réglé</dt>
                      <dd className="payer-facts__money">
                        {fcfa(invoice.amount_paid)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Échéance</dt>
                    <dd>{longDate(invoice.due_on)}</dd>
                  </div>
                </dl>

                <div
                  className={`payer-due${late && !settled ? " is-late" : ""}`}
                >
                  <div>
                    <span className="garde-eyebrow">Reste à régler</span>
                    <p className="payer-due__value">
                      {fcfa(invoice.remaining)}
                    </p>
                  </div>
                  <span className="payer-due__note">
                    {settled
                      ? "Aucun solde ouvert"
                      : disputed
                        ? "Règlement suspendu"
                        : "Un acompte est accepté"}
                  </span>
                </div>

                <p className="payer-safety">
                  Ce lien est personnel : il donne accès au montant dû. Évitez
                  de le transférer à quelqu’un d’autre.
                </p>
              </div>

              <div className="payer-side">
                <PublicPayForm
                  token={token}
                  merchantName={invoice.merchant_name}
                  remaining={invoice.remaining}
                  amountPaid={invoice.amount_paid}
                  settled={settled}
                  disputed={disputed}
                />
              </div>
            </div>

            <footer className="payer-sheet__foot">
              <p>
                Une question sur cet avis ?{" "}
                {telHref ? (
                  <a href={telHref}>
                    Appelez {invoice.merchant_name} au{" "}
                    {invoice.merchant_phone_display}
                  </a>
                ) : (
                  <>Adressez-vous directement à {invoice.merchant_name}.</>
                )}
              </p>
              <span>Montants exprimés en francs CFA.</span>
            </footer>
          </div>
        </article>

        <section className="payer-demo" aria-label="Mention de démonstration">
          <span className="stamp stamp--gold stamp--straight">Démonstration</span>
          <p>
            PALABRE est présenté ici avec des données fictives. Les paiements
            effectués sur cette page sont simulés : aucun compte Mobile Money
            n’est débité et aucun message n’est envoyé à un vrai client.
          </p>
        </section>

        <footer className="garde-foot">
          <span>PALABRE · carnet de comptes · Douala</span>
          <Link href="/">Découvrir le carnet</Link>
        </footer>
      </main>
    </div>
  );
}
