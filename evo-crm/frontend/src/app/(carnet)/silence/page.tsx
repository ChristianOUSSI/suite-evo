import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { lienWhatsApp, nouvelles } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { SansNouvelles } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Gone quiet" : "Sans nouvelles" };
}

export default async function PageSilence() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const oublies = await lire<SansNouvelles>("/silencie", langue);

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="carnet__tete">
        <span className="cadc-badge cadc-badge--orange">
          {t("reglages.silence")} {oublies.seuil} {t("commun.jours")}
        </span>
        <h1>{t("carnet.silence_titre")}</h1>
        <p>{t("carnet.silence_aide", { n: oublies.seuil })}</p>
      </div>

      {oublies.clients.length === 0 ? (
        <>
          <p className="cadc-note cadc-note--vert">{t("carnet.tous_rappelles")}</p>
          <div className="cadc-acts">
            <Link href="/carnet" className="cadc-bouton cadc-bouton--premier">
              {t("nav.carnet")}
            </Link>
          </div>
        </>
      ) : (
        <>
          <p className="cadc-champ__aide">
            {t("clients.trouves", { n: oublies.total })} ·{" "}
            {t("stat.joignables")} {oublies.clients.filter((un) => un.joignable).length}
          </p>

          <div className="cartes">
            {oublies.clients.map((client) => {
              const lien = lienWhatsApp(
                client.telephone,
                langue === "en"
                  ? `Hello ${client.nom}, we have news at the counter.`
                  : `Bonjour ${client.nom}, on a du nouveau au comptoir.`,
              );
              return (
                <article key={client.id} className="carte-client carte-client--oubliee">
                  <div className="carte-client__tete">
                    <span className="carte-client__nom">
                      <Link href={`/clients/${client.id}`}>{client.nom}</Link>
                      <small>
                        {[client.quartier, client.telephone_display, client.operateur]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                    <span className="cadc-badge cadc-badge--orange">
                      {nouvelles(client.derniers_jours, t)}
                    </span>
                  </div>

                  <p className="cadc-champ__aide">
                    {t("fiche.journal")} · {client.echanges} ·{" "}
                    {client.dernier_type ? t(`type.${client.dernier_type}`) : t("fiche.jamais")}
                  </p>

                  {client.joignable && lien ? (
                    <div className="cadc-acts">
                      <a
                        className="cadc-bouton cadc-bouton--premier cadc-bouton--petit"
                        href={lien}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t("fiche.whatsapp")}
                      </a>
                      <Link
                        href={`/clients/${client.id}`}
                        className="cadc-bouton cadc-bouton--doux cadc-bouton--petit"
                      >
                        {t("commun.voir")}
                      </Link>
                    </div>
                  ) : (
                    <p className="cadc-champ__aide">{t("fiche.rien_a_rappeler")}</p>
                  )}
                </article>
              );
            })}
          </div>

          <div className="cadc-acts">
            <Link href="/reglages" className="cadc-bouton">
              {t("reglages.silence")}
            </Link>
            <span className="cadc-champ__aide">
              {t("reglages.silence-aide")}
            </span>
          </div>
        </>
      )}

      <MentionDemo langue={langue} />
    </div>
  );
}
