import type { Metadata } from "next";
import Link from "next/link";

import { apiGet } from "@/lib/api";
import {
  dateTime,
  daysWord,
  fcfa,
  shortDate,
} from "@/lib/format";
import type { InvoiceList } from "@/lib/types";
import { Fleche } from "@/components/fleche";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Créances",
};

const STAGES = [
  { key: "all", label: "Tout" },
  { key: "late", label: "En retard" },
  { key: "promise", label: "Promesse" },
  { key: "upcoming", label: "À échoir" },
  { key: "partial", label: "Partielle" },
  { key: "paid", label: "Réglée" },
  { key: "disputed", label: "Litige" },
];

const CHANNEL_NAMES: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  voice: "Vocal",
};

type PageProps = {
  searchParams: Promise<{
    stage?: string | string[];
    q?: string | string[];
  }>;
};

export default async function CreancesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const stageParam = typeof params.stage === "string" ? params.stage : "all";
  const stage = STAGES.some((item) => item.key === stageParam)
    ? stageParam
    : "all";
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const query = new URLSearchParams();
  if (stage !== "all") {
    query.set("stage", stage);
  }
  if (q) {
    query.set("q", q);
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  const register = await apiGet<InvoiceList>(`/invoices${suffix}`);

  function tabHref(key: string): string {
    const next = new URLSearchParams();
    if (key !== "all") {
      next.set("stage", key);
    }
    if (q) {
      next.set("q", q);
    }
    const value = next.toString();
    return `/app/creances${value ? `?${value}` : ""}`;
  }

  return (
    <div className="shell creances">
      <header className="page-head creances__head">
        <div className="page-head__main">
          <span className="kicker">Feuille 02 · Le registre</span>
          <h1>Les créances, une par une.</h1>
          <p className="page-head__lede">
            {register.total_count} dossiers au carnet.{" "}
            {fcfa(register.total_outstanding)} dehors, dont{" "}
            <strong>{fcfa(register.total_late)}</strong> échus. Chaque ligne
            garde son échéance, son dernier message et sa prochaine étape.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/import" className="btn btn--ink">
            Inscrire une créance
            <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
          </Link>
        </div>
      </header>

      <div className="register-tools">
        <nav className="stage-tabs" aria-label="Filtrer par état">
          {STAGES.map((item) => {
            const count =
              item.key === "all"
                ? register.counts.all
                : (register.counts[item.key] ?? 0);
            return (
              <Link
                key={item.key}
                href={tabHref(item.key)}
                className={`stage-tab${stage === item.key ? " is-active" : ""}`}
              >
                {item.label}
                <span>{count}</span>
              </Link>
            );
          })}
        </nav>

        <form className="register-search" method="get" action="/app/creances">
          {stage !== "all" && <input type="hidden" name="stage" value={stage} />}
          <label htmlFor="invoice-search" className="visually-hidden">
            Chercher une créance
          </label>
          <input
            id="invoice-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Client, référence, téléphone"
          />
          <button type="submit" className="btn btn--small">
            Chercher
          </button>
          {q && (
            <Link
              href={
                stage === "all"
                  ? "/app/creances"
                  : `/app/creances?stage=${stage}`
              }
              className="register-search__reset"
            >
              Effacer
            </Link>
          )}
        </form>
      </div>

      <div className="register-meta">
        <span>
          <strong>{register.items.length}</strong>{" "}
          {register.items.length > 1 ? "lignes" : "ligne"}
        </span>
        <span>
          Encours <strong>{fcfa(register.total_outstanding)}</strong>
        </span>
        <span>
          Échu <strong>{fcfa(register.total_late)}</strong>
        </span>
        {q && (
          <span>
            Recherche <strong>« {q} »</strong>
          </span>
        )}
      </div>

      {register.items.length === 0 ? (
        <div className="empty register-empty">
          <span className="kicker kicker--plain">Aucune ligne</span>
          <h3>Le registre ne trouve rien ici.</h3>
          <p>
            {q
              ? `Aucune créance ne correspond à « ${q} ». Essayez un nom, une référence ou un numéro.`
              : "Aucune créance ne se trouve dans cet état pour le moment."}
          </p>
          <Link href="/app/creances" className="btn btn--small">
            Revoir tout le registre
          </Link>
        </div>
      ) : (
        <div className="register">
          <div className="register__head" aria-hidden="true">
            <span>Dossier</span>
            <span>Objet</span>
            <span>Solde</span>
            <span>Échéance</span>
            <span>État</span>
            <span />
          </div>
          {register.items.map((invoice) => (
            <Link
              href={`/app/creances/${invoice.reference}`}
              className="invoice-row"
              key={invoice.reference}
            >
              <div className="invoice-row__dossier">
                <span className="invoice-row__ref">{invoice.reference}</span>
                <strong>{invoice.customer_name}</strong>
                <span>{invoice.customer_phone_display}</span>
              </div>
              <div className="invoice-row__label">{invoice.label}</div>
              <div
                className={`invoice-row__amount${
                  invoice.remaining === 0 ? " is-settled" : ""
                }`}
              >
                {invoice.remaining > 0 ? (
                  <>
                    <span className="money">{fcfa(invoice.remaining)}</span>
                    <small>
                      {invoice.amount_paid > 0
                        ? `${fcfa(invoice.amount_paid)} réglés`
                        : "aucun règlement"}
                    </small>
                  </>
                ) : (
                  <>
                    <span className="invoice-row__settled">Soldée</span>
                    <small>{fcfa(invoice.amount_due)} facturés</small>
                  </>
                )}
              </div>
              <div className="invoice-row__due">
                <span>{shortDate(invoice.due_on)}</span>
                <small
                  className={
                    invoice.stage !== "paid" &&
                    invoice.stage !== "disputed" &&
                    invoice.days_late > 0
                      ? "is-late"
                      : ""
                  }
                >
                  {invoice.stage === "paid"
                    ? "Dossier clos"
                    : invoice.stage === "disputed"
                      ? "Relances suspendues"
                      : invoice.days_late > 0
                        ? `${daysWord(invoice.days_late)} de retard`
                        : invoice.promise_on
                          ? `Promesse le ${shortDate(invoice.promise_on)}`
                          : "À échoir"}
                </small>
              </div>
              <div className="invoice-row__state">
                <span className={`tag tag--${invoice.stage}`}>
                  {invoice.stage_label}
                </span>
                <small>
                  {invoice.last_contact_at
                    ? `${CHANNEL_NAMES[invoice.last_channel ?? ""] ?? "Contact"} le ${dateTime(invoice.last_contact_at)}`
                    : "Pas de relance"}
                </small>
              </div>
              <span className="invoice-row__arrow" aria-hidden="true">
              <Fleche />
            </span>
            </Link>
          ))}
        </div>
      )}

      <p className="register-footnote">
        Les références sont attribuées par le carnet. Un dossier peut être
        partiellement réglé : le solde et les relances suivent.
      </p>
    </div>
  );
}
