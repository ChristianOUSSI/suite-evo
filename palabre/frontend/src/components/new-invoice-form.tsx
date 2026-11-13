"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiCall } from "@/lib/client-api";
import { addDaysIso, fcfa, isoToday, longDate } from "@/lib/format";
import type { InvoiceDetail } from "@/lib/types";
import { Fleche } from "@/components/fleche";

export function NewInvoiceForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<InvoiceDetail | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const invoice = await apiCall<InvoiceDetail>("/invoices", {
        method: "POST",
        body: {
          customer_name: data.get("customer_name"),
          phone: data.get("phone"),
          quartier: data.get("quartier"),
          label: data.get("label"),
          amount_due: Number(data.get("amount_due")),
          due_on: data.get("due_on"),
          notes: data.get("notes"),
        },
      });
      setCreated(invoice);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "La créance n’a pas pu être inscrite.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <section className="entry-form" aria-labelledby="entry-title">
        <div className="entry-form__head">
          <div>
            <span className="kicker kicker--plain">Inscription</span>
            <h2 id="entry-title">La ligne est ouverte.</h2>
          </div>
          <span className="stamp entry-form__stamp">Au carnet</span>
        </div>

        <div className="entry-success" role="status">
          <div className="entry-success__top">
            <span className="entry-success__ref">
              {created.reference}
            </span>
            <span className={`tag tag--${created.stage}`}>
              {created.stage_label}
            </span>
          </div>
          <p className="entry-success__amount">
            {fcfa(created.amount_due)}
          </p>
          <dl>
            <div>
              <dt>Client</dt>
              <dd>{created.customer.name}</dd>
            </div>
            <div>
              <dt>Objet</dt>
              <dd>{created.label}</dd>
            </div>
            <div>
              <dt>Échéance</dt>
              <dd>{longDate(created.due_on)}</dd>
            </div>
            <div>
              <dt>Relances</dt>
              <dd>{created.reminders.length} dates préparées</dd>
            </div>
          </dl>
          <div className="entry-success__actions">
            <Link
              href={`/app/creances/${created.reference}`}
              className="btn btn--small btn--ink"
            >
              Ouvrir le dossier
              <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
            </Link>
            <button
              type="button"
              className="entry-success__again"
              onClick={() => setCreated(null)}
            >
              Inscrire une autre créance
            </button>
          </div>
          <p className="entry-success__note">
            Les relances ont été datées automatiquement. Le client apparaît au
            carnet avec ce numéro.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="entry-form" aria-labelledby="entry-title">
      <div className="entry-form__head">
        <div>
          <span className="kicker kicker--plain">Inscription</span>
          <h2 id="entry-title">Une créance à la main.</h2>
          <p>
            Le carnet accepte un client existant ou nouveau. Il reconnaît le
            numéro et ne crée pas de doublon.
          </p>
        </div>
        <span className="stamp entry-form__stamp">Nouveau</span>
      </div>

      <form className="entry-form__body" onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="customer-name">Nom du client</label>
            <input
              id="customer-name"
              name="customer_name"
              type="text"
              minLength={2}
              maxLength={140}
              placeholder="Ets Mbappé Bâtir"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="customer-phone">Téléphone</label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              placeholder="6 77 08 41 96"
              required
            />
            <span className="field__help">
              Mobile Money ou appel. Formats locaux acceptés.
            </span>
          </div>
          <div className="field">
            <label htmlFor="customer-quartier">Quartier</label>
            <input
              id="customer-quartier"
              name="quartier"
              type="text"
              maxLength={100}
              placeholder="Bépanda"
            />
          </div>
          <div className="field">
            <label htmlFor="invoice-due">Échéance</label>
            <input
              id="invoice-due"
              name="due_on"
              type="date"
              min={isoToday()}
              defaultValue={addDaysIso(10)}
              required
            />
          </div>
          <div className="field field--full">
            <label htmlFor="invoice-label">Objet de la créance</label>
            <input
              id="invoice-label"
              name="label"
              type="text"
              minLength={2}
              maxLength={200}
              placeholder="Ciment, fer à béton et tôles"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="invoice-amount">Montant dû</label>
            <input
              id="invoice-amount"
              name="amount_due"
              type="number"
              min={1}
              max={500_000_000}
              step={1}
              placeholder="850000"
              required
            />
            <span className="field__help">En francs CFA, sans frais ajoutés.</span>
          </div>
          <div className="field field--full">
            <label htmlFor="invoice-notes">Note de dossier</label>
            <textarea
              id="invoice-notes"
              name="notes"
              maxLength={2000}
              placeholder="Bon de livraison signé, paiement promis après le chantier."
            />
          </div>
        </div>

        {error && (
          <p className="notice notice--error entry-form__error" role="alert">
            {error}
          </p>
        )}

        <div className="entry-form__foot">
          <button
            type="submit"
            className="btn btn--ink"
            disabled={busy}
          >
            {busy ? "Inscription" : "Inscrire au carnet"}
            <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
          </button>
          <p>
            La séquence de relances se prépare à partir de l’échéance et du ton
            du carnet.
          </p>
        </div>
      </form>
    </section>
  );
}
