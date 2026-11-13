import type { Metadata } from "next";
import Link from "next/link";

import { RelanceRunner } from "@/components/relance-runner";
import { apiGet } from "@/lib/api";
import {
  dateTime,
  fcfa,
  shortDate,
} from "@/lib/format";
import { requireSession } from "@/lib/session";
import type {
  Dashboard,
  ReminderFeed,
  SequenceStep,
} from "@/lib/types";

import "../../../../styles/relances.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Relances",
};

const STEP_TITLES: Record<string, string> = {
  pre_echeance: "Un mot avant l’échéance",
  jour_echeance: "Le lien, le jour même",
  retard_3: "Demander s’il y a un contretemps",
  retard_7: "Poser le solde, sans détour",
  retard_14: "Un appel, avec une voix locale",
};

const CHANNEL_TABS = [
  { key: "all", label: "Tous" },
  { key: "sms", label: "SMS" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "voice", label: "Vocal" },
];

type PageProps = {
  searchParams: Promise<{ canal?: string | string[] }>;
};

type FeedItem = ReminderFeed["items"][number];

function offsetLabel(offset: number): string {
  if (offset === 0) {
    return "J0";
  }
  return offset > 0 ? `J+${offset}` : `J${offset}`;
}

function Parole({ item, today }: { item: FeedItem; today: string }) {
  const planned = item.status === "planned";
  const moment = planned
    ? item.scheduled_on === today
      ? "Aujourd’hui"
      : shortDate(item.scheduled_on)
    : item.sent_at
      ? dateTime(item.sent_at)
      : shortDate(item.scheduled_on);

  return (
    <article className={`parole${planned ? " is-planned" : ""}`}>
      <div className="parole__when">
        <span>{moment}</span>
        <small>{item.channel_label}</small>
      </div>
      <div className="parole__main">
        <div className="parole__line">
          <Link
            href={`/app/creances/${item.invoice_reference}`}
            className="parole__client"
          >
            {item.customer_name}
          </Link>
          <span
            className={`parole__status parole__status--${item.status}`}
          >
            {planned ? "Programmée" : "Partie"}
          </span>
        </div>
        <p className="parole__body">{item.body}</p>
        <div className="parole__meta">
          <span>{item.step_label}</span>
          <Link href={`/app/creances/${item.invoice_reference}`}>
            Ouvrir le dossier
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function RelancesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const canalParam = typeof params.canal === "string" ? params.canal : "all";
  const canal = CHANNEL_TABS.some((item) => item.key === canalParam)
    ? canalParam
    : "all";

  const [session, sequence, feed, dashboard] = await Promise.all([
    requireSession(),
    apiGet<SequenceStep[]>("/reminders/sequence"),
    apiGet<ReminderFeed>("/reminders?limit=200"),
    apiGet<Dashboard>("/dashboard"),
  ]);

  const today = dashboard.as_of;
  const filtered =
    canal === "all"
      ? feed.items
      : feed.items.filter((item) => item.channel === canal);

  const planned = filtered
    .filter((item) => item.status === "planned")
    .sort(
      (a, b) =>
        a.scheduled_on.localeCompare(b.scheduled_on) || a.id - b.id,
    );
  const sent = filtered.filter((item) => item.status === "sent");

  const plannedShown = planned.slice(0, 8);
  const sentShown = sent.slice(0, 12);
  const activeChannels = new Set(
    sequence.filter((step) => step.enabled).map((step) => step.channel),
  ).size;
  const dueCount = dashboard.stats.planned_today;

  function tabHref(key: string): string {
    return key === "all" ? "/app/relances" : `/app/relances?canal=${key}`;
  }

  function tabCount(key: string): number {
    return key === "all"
      ? feed.items.length
      : feed.items.filter((item) => item.channel === key).length;
  }

  return (
    <div className="shell relances">
      <header className="page-head relances__head">
        <div className="page-head__main">
          <span className="kicker">Feuille 03 · La parole</span>
          <h1>Une relance au bon moment.</h1>
          <p className="page-head__lede">
            {feed.sent_this_month} messages sont partis ce mois.{" "}
            {feed.planned} attendent leur date. Le carnet parle avant
            l’échéance, puis au bon rythme, et se tait dès qu’un client promet
            ou règle.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/reglages" className="btn">
            Régler le ton
          </Link>
        </div>
      </header>

      <section className="relance-band" aria-label="État des relances">
        <div className="relance-band__cell">
          <span className="eyebrow">Partis ce mois</span>
          <p className="relance-band__value">{feed.sent_this_month}</p>
          <span className="relance-band__note">
            messages remis au carnet
          </span>
        </div>
        <div className="relance-band__cell">
          <span className="eyebrow">En attente</span>
          <p className="relance-band__value">{feed.planned}</p>
          <span className="relance-band__note">
            relances déjà datées
          </span>
        </div>
        <div className="relance-band__cell relance-band__cell--alert">
          <span className="eyebrow">À traiter aujourd’hui</span>
          <p className="relance-band__value">{dueCount}</p>
          <span className="relance-band__note">
            {fcfa(dashboard.stats.overdue)} échus au total
          </span>
        </div>
        <div className="relance-band__cell">
          <span className="eyebrow">Canaux ouverts</span>
          <p className="relance-band__value">
            {activeChannels}
            <small> / 3</small>
          </p>
          <span className="relance-band__note">
            {session.merchant.auto_reminders
              ? "pilote automatique actif"
              : "pilote automatique en pause"}
          </span>
        </div>
      </section>

      {!session.merchant.auto_reminders && (
        <p className="notice relances__notice">
          Le pilote automatique est en pause. Vous pouvez relancer un dossier à
          la main depuis sa fiche, et{" "}
          <Link href="/app/reglages">le réactiver dans les réglages</Link>.
        </p>
      )}

      <div className="relance-grid">
        <div className="relance-main">
          <section className="cadence" aria-labelledby="cadence-title">
            <div className="section-head cadence__head">
              <div>
                <span className="section-head__index">La méthode</span>
                <h2 id="cadence-title">Cinq temps, pas un harcèlement.</h2>
              </div>
              <span className="section-head__aside">de J-3 à J+14</span>
            </div>

            <ol className="cadence__track">
              {sequence.map((step) => (
                <li
                  className={`cadence-step${step.enabled ? "" : " is-off"}`}
                  key={step.code}
                >
                  <span className="cadence-step__offset">
                    {offsetLabel(step.offset)}
                  </span>
                  <div className="cadence-step__main">
                    <div className="cadence-step__title">
                      <h3>{STEP_TITLES[step.code] ?? step.label}</h3>
                      <span
                        className={`channel-chip channel-chip--${step.channel}`}
                      >
                        {step.channel_label}
                      </span>
                    </div>
                    <p>{step.description}</p>
                  </div>
                  <span className="cadence-step__state">
                    {step.enabled ? "Actif" : "En pause"}
                  </span>
                </li>
              ))}
            </ol>
            <p className="cadence__foot">
              Si un canal est fermé, le message bascule sur le suivant. Un
              client qui répond STOP sort des SMS et garde son dossier.
            </p>
          </section>

          <section className="paroles" aria-labelledby="paroles-title">
            <div className="section-head paroles__head">
              <div>
                <span className="section-head__index">La chronique</span>
                <h2 id="paroles-title">Ce qui est sorti, ce qui attend.</h2>
              </div>
              <span className="section-head__aside">
                {filtered.length} message{filtered.length > 1 ? "s" : ""}
              </span>
            </div>

            <nav className="parole-tabs" aria-label="Filtrer par canal">
              {CHANNEL_TABS.map((tab) => (
                <Link
                  key={tab.key}
                  href={tabHref(tab.key)}
                  className={`parole-tab${canal === tab.key ? " is-active" : ""}`}
                >
                  {tab.label}
                  <span>{tabCount(tab.key)}</span>
                </Link>
              ))}
            </nav>

            <div className="paroles__group">
              <h3 className="paroles__group-title">
                À venir
                <span>{planned.length}</span>
              </h3>
              {plannedShown.length === 0 ? (
                <p className="paroles__empty">
                  Aucun message programmé dans ce canal.
                </p>
              ) : (
                plannedShown.map((item) => (
                  <Parole
                    key={`planned-${item.id}`}
                    item={item}
                    today={today}
                  />
                ))
              )}
              {planned.length > plannedShown.length && (
                <p className="paroles__more">
                  {planned.length - plannedShown.length} autre
                  {planned.length - plannedShown.length > 1 ? "s" : ""} au
                  calendrier.
                </p>
              )}
            </div>

            <div className="paroles__group">
              <h3 className="paroles__group-title">
                Déjà partis
                <span>{sent.length}</span>
              </h3>
              {sentShown.length === 0 ? (
                <p className="paroles__empty">
                  Rien n’est encore sorti dans ce canal.
                </p>
              ) : (
                sentShown.map((item) => (
                  <Parole key={`sent-${item.id}`} item={item} today={today} />
                ))
              )}
              {sent.length > sentShown.length && (
                <p className="paroles__more">
                  {sent.length - sentShown.length} message
                  {sent.length - sentShown.length > 1 ? "s" : ""} plus ancien
                  {sent.length - sentShown.length > 1 ? "s" : ""} au carnet.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="relance-rail">
          <RelanceRunner dueCount={dueCount} />

          <section className="voice-card" aria-labelledby="voice-title">
            <span className="kicker kicker--plain">La voix du carnet</span>
            <p className="voice-card__tone">
              {session.merchant.tone === "ferme" ? "Ferme" : "Courtois"}
            </p>
            <h3 id="voice-title">
              {session.merchant.tone === "ferme"
                ? "Droit au but, sans menace."
                : "Amiable, sans lâcher la date."}
            </h3>
            <p>
              {session.merchant.tone === "ferme"
                ? "Les messages vont au solde et à la prochaine étape. Le ton ne menace jamais : il date."
                : "Les messages laissent une porte ouverte au contretemps, puis rappellent le lien de paiement."}
            </p>
            <Link href="/app/reglages" className="text-link">
              Changer le ton
            </Link>
          </section>

          <section className="stop-card">
            <span className="eyebrow">Une règle simple</span>
            <p>
              Pas de relance sur un dossier en litige ou déjà réglé, et un STOP
              toujours respecté. Le carnet protège la relation autant que la
              caisse.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
