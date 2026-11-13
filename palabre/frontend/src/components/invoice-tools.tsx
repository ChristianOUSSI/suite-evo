"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiCall } from "@/lib/client-api";
import { addDaysIso, fcfa, longDate } from "@/lib/format";
import type { Receipt } from "@/lib/types";
import { Fleche } from "@/components/fleche";

type Panel = "pay" | "promise" | null;
type Feedback = { kind: "success" | "error"; text: string };

type Props = {
  reference: string;
  remaining: number;
  status: string;
  canPay: boolean;
  optOut: boolean;
  customerPhone: string;
};

export function InvoiceTools({
  reference,
  remaining,
  status,
  canPay,
  optOut,
  customerPhone,
}: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [remindedBody, setRemindedBody] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [payAmount, setPayAmount] = useState(String(remaining));
  const [payMethod, setPayMethod] = useState<"cash" | "momo_mtn" | "momo_orange">(
    "cash",
  );
  const [payPhone, setPayPhone] = useState(customerPhone);
  const [promiseAmount, setPromiseAmount] = useState(String(remaining));
  const [promiseDate, setPromiseDate] = useState(addDaysIso(7));
  const [promiseNote, setPromiseNote] = useState("");
  const [confirmDispute, setConfirmDispute] = useState(false);

  const canRemind = status === "open" && remaining > 0 && !optOut;
  const canPromise = status === "open" && remaining > 0;

  async function remind() {
    setBusy("remind");
    setFeedback(null);
    setRemindedBody("");
    try {
      const result = await apiCall<{
        reminder: { channel_label: string; body: string };
      }>(`/invoices/${reference}/remind`, { method: "POST" });
      setFeedback({
        kind: "success",
        text: `Relance ${result.reminder.channel_label} envoyée. Elle figure dans la chronique.`,
      });
      setRemindedBody(result.reminder.body);
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "La relance n’a pas pu être envoyée.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("pay");
    setFeedback(null);
    try {
      const result = await apiCall<Receipt>(
        `/invoices/${reference}/payments`,
        {
          method: "POST",
          body: {
            amount: Number(payAmount),
            method: payMethod,
            ...(payMethod === "cash" ? {} : { phone: payPhone }),
          },
        },
      );
      setReceipt(result);
      setPanel(null);
      setFeedback({
        kind: "success",
        text: `Règlement consigné sous le reçu ${result.receipt}.`,
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Le règlement n’a pas pu être enregistré.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function submitPromise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("promise");
    setFeedback(null);
    try {
      await apiCall(`/invoices/${reference}/promise`, {
        method: "POST",
        body: {
          amount: Number(promiseAmount),
          promised_on: promiseDate,
          note: promiseNote,
        },
      });
      setPanel(null);
      setPromiseNote("");
      setFeedback({
        kind: "success",
        text: "Promesse notée. Le dossier reste dans le carnet, avec une date.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "La promesse n’a pas pu être notée.",
      });
    } finally {
      setBusy(null);
    }
  }

  async function toggleDispute() {
    setBusy("dispute");
    setFeedback(null);
    const nextStatus = status === "disputed" ? "open" : "disputed";
    try {
      await apiCall(`/invoices/${reference}/status`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      setConfirmDispute(false);
      setFeedback({
        kind: "success",
        text:
          nextStatus === "disputed"
            ? "Dossier marqué en litige. Les relances sont suspendues."
            : "Dossier rouvert. Les relances peuvent reprendre.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "Le statut du dossier n’a pas pu être modifié.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="tools" aria-label="Actions sur le dossier">
      <div className="tools__head">
        <span className="kicker kicker--plain">Actions du dossier</span>
        <span
          className={`stamp stamp--straight${
            status === "paid" ? " stamp--moss" : ""
          }`}
        >
          {status === "paid"
            ? "Réglé"
            : status === "disputed"
              ? "En pause"
              : "À suivre"}
        </span>
      </div>
      <h2>La prochaine étape.</h2>
      <p className="tools__lede">
        Relancez avec le ton du carnet, encaissez un règlement, ou donnez une
        date au client.
      </p>

      {feedback && (
        <p
          className={`notice notice--${feedback.kind} tools__notice`}
          role="status"
        >
          {feedback.text}
        </p>
      )}

      {remindedBody && (
        <p className="tools__preview">{remindedBody}</p>
      )}

      {status === "paid" && (
        <p className="notice tools__notice">
          Ce dossier est réglé. Les relances sont arrêtées et le reçu reste au
          carnet.
        </p>
      )}

      {status === "disputed" && (
        <p className="notice tools__notice">
          Dossier en litige. Les relances restent en pause jusqu’à sa
          réouverture.
        </p>
      )}

      <div className="tools__primary">
        <button
          type="button"
          className="btn btn--stamp btn--block"
          onClick={remind}
          disabled={!canRemind || busy !== null}
        >
          {busy === "remind" ? "Préparation du message" : "Relancer maintenant"}
          <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
        </button>
        <span className="tools__hint">
          {optOut
            ? "Ce client est désinscrit des relances."
            : "Le message reprend le ton choisi dans les réglages."}
        </span>
      </div>

      <div className="tools__split">
        <button
          type="button"
          className={`btn${panel === "pay" ? " btn--ink" : ""}`}
          onClick={() => {
            if (panel !== "pay") {
              setPayAmount(String(remaining));
            }
            setPanel(panel === "pay" ? null : "pay");
          }}
          disabled={!canPay}
          aria-expanded={panel === "pay"}
        >
          Encaisser
        </button>
        <button
          type="button"
          className={`btn${panel === "promise" ? " btn--ink" : ""}`}
          onClick={() => {
            if (panel !== "promise") {
              setPromiseAmount(String(remaining));
            }
            setPanel(panel === "promise" ? null : "promise");
          }}
          disabled={!canPromise}
          aria-expanded={panel === "promise"}
        >
          Promesse
        </button>
      </div>

      {receipt && (
        <div className="receipt-mini">
          <div className="receipt-mini__head">
            <span className="stamp stamp--moss stamp--straight">
              {receipt.remaining === 0 ? "Dossier réglé" : "Reçu partiel"}
            </span>
            <span>{receipt.receipt}</span>
          </div>
          <dl>
            <div>
              <dt>Montant reçu</dt>
              <dd>{fcfa(receipt.amount)}</dd>
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
          <p>
            {longDate(receipt.paid_at.slice(0, 10))} ·{" "}
            <Link href="/app/caisse">Voir la caisse</Link>
          </p>
        </div>
      )}

      {panel === "pay" && (
        <form className="tools-form" onSubmit={submitPayment}>
          <div className="tools-form__head">
            <span>Encaissement manuel</span>
            <button
              type="button"
              className="tools-form__close"
              onClick={() => setPanel(null)}
            >
              Fermer
            </button>
          </div>
          <div className="field">
            <label htmlFor="payment-amount">Montant reçu</label>
            <input
              id="payment-amount"
              type="number"
              min={1}
              max={remaining}
              value={payAmount}
              onChange={(event) => setPayAmount(event.target.value)}
              required
            />
            <span className="field__help">
              Solde dû : {fcfa(remaining)}. Un acompte est accepté.
            </span>
          </div>
          <div className="field">
            <span className="field__label">Moyen de paiement</span>
            <div className="method-picker">
              {(
                [
                  ["cash", "Espèces"],
                  ["momo_mtn", "MTN MoMo"],
                  ["momo_orange", "Orange"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`method${payMethod === value ? " is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={value}
                    checked={payMethod === value}
                    onChange={() => setPayMethod(value)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          {payMethod !== "cash" && (
            <div className="field">
              <label htmlFor="payment-phone">Numéro Mobile Money</label>
              <input
                id="payment-phone"
                type="tel"
                value={payPhone}
                onChange={(event) => setPayPhone(event.target.value)}
                placeholder="6 77 08 41 96"
              />
            </div>
          )}
          <button
            type="submit"
            className="btn btn--ink btn--block"
            disabled={busy !== null}
          >
            {busy === "pay" ? "Enregistrement" : "Enregistrer le règlement"}
          </button>
          <p className="tools__fine">
            Simulation de démonstration. Le reçu et le solde se mettent à jour
            dans le carnet.
          </p>
        </form>
      )}

      {panel === "promise" && (
        <form className="tools-form" onSubmit={submitPromise}>
          <div className="tools-form__head">
            <span>Promesse de paiement</span>
            <button
              type="button"
              className="tools-form__close"
              onClick={() => setPanel(null)}
            >
              Fermer
            </button>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="promise-amount">Montant promis</label>
              <input
                id="promise-amount"
                type="number"
                min={1}
                max={remaining}
                value={promiseAmount}
                onChange={(event) => setPromiseAmount(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="promise-date">Date promise</label>
              <input
                id="promise-date"
                type="date"
                min={addDaysIso(0)}
                value={promiseDate}
                onChange={(event) => setPromiseDate(event.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="promise-note">Note de conversation</label>
            <input
              id="promise-note"
              type="text"
              maxLength={240}
              value={promiseNote}
              onChange={(event) => setPromiseNote(event.target.value)}
              placeholder="Le comptable passe vendredi matin."
            />
          </div>
          <button
            type="submit"
            className="btn btn--ink btn--block"
            disabled={busy !== null}
          >
            {busy === "promise" ? "Enregistrement" : "Noter la promesse"}
          </button>
        </form>
      )}

      {status !== "paid" && (
        <div className="tools__dispute">
          <span className="eyebrow">Litige</span>
          {status === "disputed" ? (
            <>
              <p>
                Un désaccord a mis ce dossier de côté. Le rouvrir prépare de
                nouveau la séquence de relances.
              </p>
              <button
                type="button"
                className="link-button"
                onClick={toggleDispute}
                disabled={busy !== null}
              >
                {busy === "dispute" ? "Réouverture" : "Rouvrir le dossier"}
              </button>
            </>
          ) : confirmDispute ? (
            <>
              <p>
                Les relances seront suspendues. Le solde reste dans l’encours.
              </p>
              <div className="confirm-row">
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={toggleDispute}
                  disabled={busy !== null}
                >
                  {busy === "dispute" ? "Enregistrement" : "Confirmer le litige"}
                </button>
                <button
                  type="button"
                  className="btn btn--small btn--quiet"
                  onClick={() => setConfirmDispute(false)}
                >
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                Marchandise contestée, montant discuté : mettez le dossier en
                pause sans le faire disparaître.
              </p>
              <button
                type="button"
                className="link-button"
                onClick={() => setConfirmDispute(true)}
              >
                Marquer en litige
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
