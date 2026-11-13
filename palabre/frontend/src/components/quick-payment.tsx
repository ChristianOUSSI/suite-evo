"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiCall } from "@/lib/client-api";
import { fcfa, longDate } from "@/lib/format";
import type { Receipt } from "@/lib/types";

type QuickInvoice = {
  reference: string;
  customer_name: string;
  customer_phone: string;
  remaining: number;
  due_on: string;
};

type PayMethod = "cash" | "momo_mtn" | "momo_orange";

const METHODS = [
  ["cash", "Espèces"],
  ["momo_mtn", "MTN MoMo"],
  ["momo_orange", "Orange Money"],
] as const;

export function QuickPayment({ invoices }: { invoices: QuickInvoice[] }) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const listKey = invoices
    .map((invoice) => `${invoice.reference}:${invoice.remaining}`)
    .join("|");

  function handlePaid(result: Receipt) {
    setReceipt(result);
    router.refresh();
  }

  return (
    <section className="quick-pay" aria-labelledby="quick-pay-title">
      <div className="quick-pay__head">
        <div>
          <span className="kicker kicker--plain">Au comptoir</span>
          <h2 id="quick-pay-title">Encaisser vite.</h2>
        </div>
        <span className="stamp quick-pay__stamp">Reçu</span>
      </div>

      {receipt ? (
        <div className="quick-receipt" role="status">
          <div className="quick-receipt__top">
            <span className="stamp stamp--moss stamp--straight">
              {receipt.remaining === 0 ? "Dossier réglé" : "Reçu partiel"}
            </span>
            <span className="quick-receipt__ref">{receipt.receipt}</span>
          </div>
          <p className="quick-receipt__amount">{fcfa(receipt.amount)}</p>
          <dl>
            <div>
              <dt>Dossier</dt>
              <dd>{receipt.invoice_reference}</dd>
            </div>
            <div>
              <dt>Moyen</dt>
              <dd>{receipt.method_label}</dd>
            </div>
            <div>
              <dt>Solde restant</dt>
              <dd>{fcfa(receipt.remaining)}</dd>
            </div>
          </dl>
          <p className="quick-receipt__date">
            {longDate(receipt.paid_at.slice(0, 10))}
          </p>
          <div className="quick-receipt__actions">
            <Link
              href={`/app/creances/${receipt.invoice_reference}`}
              className="text-link"
            >
              Voir le dossier
            </Link>
            <button
              type="button"
              className="quick-pay__again"
              onClick={() => setReceipt(null)}
            >
              Nouvel encaissement
            </button>
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <p className="quick-pay__empty">
          Toutes les créances sont soldées ou en litige. Il n’y a rien à
          encaisser pour le moment.
        </p>
      ) : (
        <QuickPaymentForm
          key={listKey}
          invoices={invoices}
          onPaid={handlePaid}
        />
      )}
    </section>
  );
}

function QuickPaymentForm({
  invoices,
  onPaid,
}: {
  invoices: QuickInvoice[];
  onPaid: (receipt: Receipt) => void;
}) {
  const first = invoices[0];
  const [reference, setReference] = useState(first.reference);
  const [amount, setAmount] = useState(String(first.remaining));
  const [method, setMethod] = useState<PayMethod>("cash");
  const [phone, setPhone] = useState(first.customer_phone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected =
    invoices.find((invoice) => invoice.reference === reference) ?? first;

  function choose(nextReference: string) {
    setReference(nextReference);
    setError("");
    const next = invoices.find(
      (invoice) => invoice.reference === nextReference,
    );
    setAmount(next ? String(next.remaining) : "");
    setPhone(next?.customer_phone ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await apiCall<Receipt>(
        `/invoices/${selected.reference}/payments`,
        {
          method: "POST",
          body: {
            amount: Number(amount),
            method,
            ...(method === "cash" ? {} : { phone }),
          },
        },
      );
      onPaid(result);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Le règlement n’a pas pu être enregistré.",
      );
    } finally {
      setBusy(false);
    }
  }

  const fee = Math.round(Number(amount || 0) * 0.03);

  return (
    <form className="quick-pay__form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="quick-invoice">Créance à régler</label>
        <select
          id="quick-invoice"
          value={reference}
          onChange={(event) => choose(event.target.value)}
          required
        >
          {invoices.map((invoice) => (
            <option key={invoice.reference} value={invoice.reference}>
              {invoice.reference} · {invoice.customer_name} ·{" "}
              {fcfa(invoice.remaining)}
            </option>
          ))}
        </select>
        <span className="field__help">
          Échéance du {longDate(selected.due_on)}. Solde dû :{" "}
          {fcfa(selected.remaining)}.
        </span>
      </div>

      <div className="field">
        <label htmlFor="quick-amount">Montant reçu</label>
        <input
          id="quick-amount"
          type="number"
          min={1}
          max={selected.remaining}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
        <span className="field__help">
          Un acompte est accepté. Les frais de service sont comptés à part.
        </span>
      </div>

      <div className="field">
        <span className="field__label">Moyen de paiement</span>
        <div className="quick-methods">
          {METHODS.map(([value, label]) => (
            <label
              key={value}
              className={`quick-method${method === value ? " is-active" : ""}`}
            >
              <input
                type="radio"
                name="quick-method"
                value={value}
                checked={method === value}
                onChange={() => setMethod(value)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {method !== "cash" && (
        <div className="field">
          <label htmlFor="quick-phone">Numéro Mobile Money</label>
          <input
            id="quick-phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
      )}

      <div className="quick-pay__fee">
        <span>Frais de service estimés</span>
        <span>{fcfa(fee)}</span>
      </div>

      {error && (
        <p className="notice notice--error quick-pay__error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--stamp btn--block"
        disabled={busy}
      >
        {busy ? "Enregistrement" : "Enregistrer le règlement"}
      </button>
      <p className="quick-pay__fine">
        Démonstration : le reçu est consigné dans le carnet, sans transaction
        Mobile Money réelle.
      </p>
    </form>
  );
}
