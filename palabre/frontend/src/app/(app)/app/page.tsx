import type { Metadata } from "next";
import Link from "next/link";

import { WeekBars } from "@/components/week-bars";
import { apiGet } from "@/lib/api";
import {
  dateTime,
  daysWord,
  fcfa,
  fcfaCompact,
  longDate,
  shortDate,
} from "@/lib/format";
import { requireSession } from "@/lib/session";
import type { Dashboard } from "@/lib/types";
import { Fleche } from "@/components/fleche";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
};

const CHANNEL_NAMES: Record<string, string> = {
  sms: "SMS",
  whatsapp: "WhatsApp",
  voice: "vocal",
  momo_mtn: "MTN MoMo",
  momo_orange: "Orange Money",
  cash: "espèces",
};

const ACTIVITY_NAMES: Record<string, string> = {
  payment: "Règlement",
  reminder: "Relance",
  promise: "Promesse",
};

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

export default async function JournalPage() {
  const session = await requireSession();
  const data = await apiGet<Dashboard>("/dashboard");
  const stats = data.stats;
  const firstName = session.merchant.owner_name.split(" ")[0];
  const plannedChannels = Object.entries(stats.planned_channels);
  const agingMax = Math.max(...data.aging.map((bucket) => bucket.amount), 1);

  return (
    <div className="shell journal">
      <header className="page-head journal__head">
        <div className="page-head__main">
          <span className="kicker">
            Feuille du jour · {longDate(data.as_of)}
          </span>
          <h1>Bonjour, {firstName}.</h1>
          <p className="page-head__lede">
            {fcfa(stats.overdue)} sont échus.{" "}
            {plural(stats.late_count, "dossier a", "dossiers ont")} dépassé leur
            date, et {plural(stats.planned_today, "relance attend", "relances attendent")}{" "}
            dans la tournée du jour.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/creances" className="btn">
            Parcourir les créances
          </Link>
        </div>
      </header>

      <section className="summary-band" aria-label="Chiffres du carnet">
        <div className="summary-band__cell">
          <span className="eyebrow">Encours clients</span>
          <p className="summary-band__value">{fcfa(stats.outstanding)}</p>
          <span className="summary-band__note">
            {plural(stats.open_count, "créance ouverte", "créances ouvertes")}
          </span>
        </div>
        <div className="summary-band__cell summary-band__cell--alert">
          <span className="eyebrow">Échu à ce jour</span>
          <p className="summary-band__value">{fcfa(stats.overdue)}</p>
          <span className="summary-band__note">
            {plural(stats.late_count, "dossier en retard", "dossiers en retard")}
          </span>
        </div>
        <div className="summary-band__cell">
          <span className="eyebrow">Encaissé ce mois</span>
          <p className="summary-band__value">{fcfa(stats.collected_month)}</p>
          <span className="summary-band__note">
            Taux de recouvrement {stats.recovery_rate} %
          </span>
        </div>
        <div className="summary-band__cell">
          <span className="eyebrow">Objectif du mois</span>
          <p className="summary-band__value summary-band__value--progress">
            {stats.monthly_progress} %
          </p>
          <span className="summary-band__scale" aria-hidden="true">
            <span style={{ width: `${stats.monthly_progress}%` }} />
          </span>
          <span className="summary-band__note">
            Cible : {fcfa(stats.monthly_target)}
          </span>
        </div>
      </section>

      <div className="journal-grid">
        <section className="priorities">
          <div className="section-head">
            <div>
              <span className="section-head__index">01</span>
              <h2>Les dossiers du matin.</h2>
            </div>
            <Link href="/app/creances" className="text-link">
              Toutes les créances
            </Link>
          </div>

          {data.priorities.length === 0 ? (
            <div className="empty">
              <span className="kicker kicker--plain">Carnet à jour</span>
              <h3>Aucune créance en retard.</h3>
              <p>
                Le carnet n’a rien à relancer aujourd’hui. Les prochaines
                échéances apparaîtront ici.
              </p>
            </div>
          ) : (
            <ol className="priority-list">
              {data.priorities.map((invoice, index) => (
                <li key={invoice.reference}>
                  <Link
                    href={`/app/creances/${invoice.reference}`}
                    className="priority"
                  >
                    <span className="priority__rank">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="priority__main">
                      <div className="priority__line">
                        <strong>{invoice.customer_name}</strong>
                        <span className={`tag tag--${invoice.stage}`}>
                          {invoice.stage_label}
                        </span>
                      </div>
                      <span className="priority__ref">
                        {invoice.reference} · échéance du{" "}
                        {shortDate(invoice.due_on)}
                      </span>
                      <span className="priority__contact">
                        {invoice.promise_on
                          ? `Promesse attendue le ${shortDate(invoice.promise_on)}`
                          : invoice.last_contact_at
                            ? `Dernier contact le ${dateTime(invoice.last_contact_at)}`
                            : "Aucune relance envoyée"}
                      </span>
                    </div>
                    <div className="priority__amount">
                      <span className="money">{fcfa(invoice.remaining)}</span>
                      <small>{daysWord(invoice.days_late)} de retard</small>
                    </div>
                    <span className="priority__arrow" aria-hidden="true">
              <Fleche />
            </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="journal-aside">
          <article className="tournee-card">
            <div className="tournee-card__head">
              <span className="kicker kicker--plain">La tournée du jour</span>
              <span className="stamp">Prête</span>
            </div>
            <p className="tournee-card__figure">
              {String(stats.planned_today).padStart(2, "0")}
            </p>
            <h2 className="tournee-card__title">
              {stats.planned_today > 1 ? "relances prêtes" : "relance prête"}
            </h2>
            <p className="tournee-card__channels">
              {plannedChannels.length > 0
                ? plannedChannels
                    .map(
                      ([channel, count]) =>
                        `${CHANNEL_NAMES[channel] ?? channel} ${count}`,
                    )
                    .join(" · ")
                : "Le carnet ne prépare rien avant la prochaine échéance."}
            </p>
            <dl className="tournee-card__facts">
              <div>
                <dt>Promesses à échéance</dt>
                <dd>{String(stats.promises_due).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Retard moyen</dt>
                <dd>{stats.average_days_late} j</dd>
              </div>
              <div>
                <dt>Clients au carnet</dt>
                <dd>{stats.customers_count}</dd>
              </div>
            </dl>
            <Link
              href="/app/relances"
              className="btn btn--stamp btn--block tournee-card__action"
            >
              Ouvrir la tournée
              <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
            </Link>
          </article>

          <article className="aging-card">
            <div className="aging-card__head">
              <h3>L’âge des créances</h3>
              <span className="eyebrow">Montant échu</span>
            </div>
            <ul className="aging-list">
              {data.aging.map((bucket) => (
                <li key={bucket.key}>
                  <div className="aging-list__top">
                    <span>{bucket.label}</span>
                    <span className="aging-list__count">{bucket.count}</span>
                  </div>
                  <div className="aging-list__track">
                    <span
                      style={{
                        width: `${Math.round((bucket.amount / agingMax) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="aging-list__amount">
                    {fcfaCompact(bucket.amount)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="aging-card__note">
              Les créances de plus de 60 jours pèsent le plus lourd. C’est là
              que le carnet sert le plus.
            </p>
          </article>

          {session.merchant.daily_report && (
            <section className="evening-note" aria-label="Le point du soir">
              <div className="evening-note__head">
                <span className="kicker kicker--plain">Le point du soir</span>
                <span>{shortDate(data.as_of)}</span>
              </div>
              <p className="evening-note__lede">
                {stats.planned_today > 0
                  ? `${plural(stats.planned_today, "relance reste", "relances restent")} dans la tournée du jour.`
                  : "Aucune relance n’attend. Le carnet est calme ce soir."}
              </p>
              <dl className="evening-note__lines">
                <div>
                  <dt>Encaissé ce mois</dt>
                  <dd>{fcfa(stats.collected_month)}</dd>
                </div>
                <div>
                  <dt>Promesses à échéance</dt>
                  <dd>{String(stats.promises_due).padStart(2, "0")}</dd>
                </div>
                <div>
                  <dt>Reste échu</dt>
                  <dd>{fcfa(stats.overdue)}</dd>
                </div>
              </dl>
              <p className="evening-note__sign">À demain, {firstName}.</p>
            </section>
          )}
        </aside>
      </div>

      <div className="journal-bottom">
        <section className="movements">
          <div className="section-head">
            <div>
              <span className="section-head__index">02</span>
              <h2>Derniers mouvements.</h2>
            </div>
            <Link href="/app/caisse" className="text-link">
              Tenir la caisse
            </Link>
          </div>
          {data.activity.length === 0 ? (
            <p className="movements__empty">
              Rien n’a encore bougé dans le carnet.
            </p>
          ) : (
            <ul className="movement-list">
              {data.activity.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/app/creances/${event.invoice_reference}`}
                    className="movement"
                  >
                    <span className="movement__date">
                      {dateTime(event.at)}
                    </span>
                    <span className={`movement__kind movement__kind--${event.type}`}>
                      {ACTIVITY_NAMES[event.type] ?? event.type}
                    </span>
                    <span className="movement__main">
                      <strong>{event.customer_name}</strong>
                      <small>
                        {event.invoice_reference}
                        {event.channel
                          ? ` · ${CHANNEL_NAMES[event.channel] ?? event.channel}`
                          : ""}
                      </small>
                    </span>
                    <span
                      className={`movement__amount${
                        event.amount === null ? " movement__amount--none" : ""
                      }`}
                    >
                      {event.amount !== null
                        ? fcfa(event.amount)
                        : event.type === "promise"
                          ? "Promesse"
                          : "Message"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="collections">
          <div className="section-head">
            <div>
              <span className="section-head__index">03</span>
              <h2>La caisse, semaine par semaine.</h2>
            </div>
          </div>
          <WeekBars points={data.collections} />
          <p className="collections__note">
            Chaque barre représente les règlements confirmés d’une semaine.
            Objectif du mois : {fcfa(stats.monthly_target)}.
          </p>
        </section>
      </div>
    </div>
  );
}
