"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { apiCall } from "@/lib/client-api";
import { ApiError } from "@/lib/errors";
import { dateTime, fcfa } from "@/lib/format";
import type { Receipt } from "@/lib/types";
import { Fleche } from "@/components/fleche";

type Method = "momo_mtn" | "momo_orange";

const METHODS: { value: Method; name: string; note: string; tone: string }[] = [
  {
    value: "momo_mtn",
    name: "MTN MoMo",
    note: "Portefeuille MTN",
    tone: "mtn",
  },
  {
    value: "momo_orange",
    name: "Orange Money",
    note: "Portefeuille Orange",
    tone: "orange",
  },
];

function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("237")) {
    digits = digits.slice(3);
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 9 && digits.startsWith("6")) {
    return `+237${digits}`;
  }
  return null;
}

type Props = {
  token: string;
  merchantName: string;
  remaining: number;
  amountPaid: number;
  settled: boolean;
  disputed: boolean;
};

export function PublicPayForm({
  token,
  merchantName,
  remaining,
  amountPaid,
  settled,
  disputed,
}: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("momo_mtn");
  const [amount, setAmount] = useState(String(remaining));
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const methodName =
    METHODS.find((item) => item.value === method)?.name ?? "Mobile Money";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const value = Number(amount);
    if (!Number.isInteger(value) || value <= 0) {
      setError("Indiquez un montant entier, en francs CFA.");
      return;
    }
    if (value > remaining) {
      setError(`Le solde restant est de ${fcfa(remaining)}.`);
      return;
    }

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setError(
        "Entrez un numéro camerounais à 9 chiffres, par exemple 6 77 08 41 96.",
      );
      return;
    }

    setBusy(true);
    try {
      const result = await apiCall<Receipt>(
        `/public/invoices/${token}/pay`,
        {
          method: "POST",
          body: { amount: value, method, phone: normalized },
        },
      );
      setReceipt(result);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Le paiement n’a pas pu aboutir. Réessayez dans un instant.",
      );
      if (caught instanceof ApiError && caught.status === 409) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (receipt) {
    const done = receipt.remaining === 0;
    return (
      <div className="payer-receipt" role="status" aria-live="polite">
        <div className="payer-receipt__head">
          <span className="stamp stamp--moss stamp--straight">
            {done ? "Compte soldé" : "Reçu partiel"}
          </span>
          <span className="payer-receipt__number">
            Reçu {receipt.receipt}
          </span>
        </div>
        <h2>{done ? "Tout est réglé." : "Paiement enregistré."}</h2>
        <p className="payer-receipt__lead">
          {done
            ? `Le solde de ${fcfa(receipt.amount)} a été consigné au carnet de ${merchantName}.`
            : `Nous avons reçu ${fcfa(receipt.amount)}. Le solde restant est de ${fcfa(receipt.remaining)}.`}
        </p>
        <dl className="payer-receipt__lines">
          <div>
            <dt>Montant réglé</dt>
            <dd>{fcfa(receipt.amount)}</dd>
          </div>
          <div>
            <dt>Moyen utilisé</dt>
            <dd>{receipt.method_label}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>{dateTime(receipt.paid_at)}</dd>
          </div>
          <div>
            <dt>Référence facture</dt>
            <dd>{receipt.invoice_reference}</dd>
          </div>
        </dl>
        <div className="payer-receipt__actions">
          {!done && (
            <button
              type="button"
              className="btn btn--ink"
              onClick={() => {
                setAmount(String(receipt.remaining));
                setReceipt(null);
                setError(null);
                setPhone("");
              }}
            >
              Payer le reste
            </button>
          )}
          <span className="payer-receipt__fine">
            Reçu de démonstration. Aucun compte Mobile Money n’a été débité.
          </span>
        </div>
      </div>
    );
  }

  if (settled) {
    return (
      <div className="payer-closed">
        <span className="stamp stamp--moss stamp--straight">Compte soldé</span>
        <h2>Plus rien à régler.</h2>
        <p>
          Le compte de {merchantName} est soldé pour cet avis. Le règlement de{" "}
          {fcfa(amountPaid)} y figure déjà.
        </p>
        <p className="payer-closed__fine">
          Une erreur de montant ? Contactez directement le commerçant.
        </p>
      </div>
    );
  }

  if (disputed) {
    return (
      <div className="payer-closed payer-closed--disputed">
        <span className="stamp stamp--straight">En litige</span>
        <h2>Le règlement est en pause.</h2>
        <p>
          {merchantName} a suspendu cet avis pour éclaircir un point. Parlez-en
          avec le commerçant avant de payer : le montant ou la marchandise peut
          encore changer.
        </p>
        <p className="payer-closed__fine">
          Ce lien reste valable. Il redeviendra actif si le dossier est rouvert.
        </p>
      </div>
    );
  }

  return (
    <form className="payer-pay" onSubmit={submit} noValidate>
      <div className="payer-pay__head">
        <span className="garde-eyebrow">Paiement en ligne</span>
        <h2>Régler cet avis</h2>
        <p>
          Pas de compte à créer. Choisissez votre portefeuille, confirmez le
          montant, et le reçu s’affiche aussitôt.
        </p>
      </div>

      <div className="payer-field">
        <span className="payer-label" id="payer-method-label">
          Moyen de paiement
        </span>
        <div
          className="payer-methods"
          role="group"
          aria-labelledby="payer-method-label"
        >
          {METHODS.map((item) => (
            <label
              key={item.value}
              className={`payer-method payer-method--${item.tone}${
                method === item.value ? " is-active" : ""
              }`}
            >
              <input
                type="radio"
                name="payer-method"
                value={item.value}
                checked={method === item.value}
                onChange={() => setMethod(item.value)}
              />
              <span className="payer-method__dot" aria-hidden="true" />
              <span className="payer-method__text">
                <span className="payer-method__name">{item.name}</span>
                <span className="payer-method__note">{item.note}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="payer-field">
        <label className="payer-label" htmlFor="payer-amount">
          Montant à régler
        </label>
        <div className="payer-amount">
          <input
            id="payer-amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={remaining}
            step={1}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <span aria-hidden="true">FCFA</span>
        </div>
        <span className="payer-help">
          Solde dû : {fcfa(remaining)}. Un acompte est accepté.
        </span>
      </div>

      <div className="payer-field">
        <label className="payer-label" htmlFor="payer-phone">
          Numéro {methodName}
        </label>
        <div className="payer-phone">
          <span aria-hidden="true">+237</span>
          <input
            id="payer-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="6 77 08 41 96"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
        <span className="payer-help">
          Un numéro camerounais à 9 chiffres. Il sert uniquement au reçu.
        </span>
      </div>

      {error && (
        <p className="notice notice--error payer-alert" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn--ink btn--block payer-submit"
        disabled={busy}
      >
        {busy ? "Enregistrement du paiement" : `Payer avec ${methodName}`}
        {!busy && (
          <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
        )}
      </button>

      <p className="payer-fine">
        Démonstration : le paiement est simulé, rien n’est débité de votre
        compte. Les frais de service PALABRE sont à la charge du commerçant.
      </p>
    </form>
  );
}
