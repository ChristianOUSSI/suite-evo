import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats, retard } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat, FileDeRelances, SansNouvelles } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Today" : "Aujourd'hui" };
}

export default async function PageCarnet() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const [etat, file, oublies] = await Promise.all([
    lire<Etat>("/etat", langue),
    lire<FileDeRelances>("/relances", langue),
    lire<SansNouvelles>("/silencie", langue),
  ]);

  const relances = [...file.en_retard, ...file.du_jour.filter((un) => un.retard === 0)];

  return (
    <div className="cadc-gabarit carnet">
      <div className="carnet__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("carnet.titre")}</h1>
        <p>{t("carnet.chapo")}</p>
      </div>

      <div className="bloques">
        <section className="cadc-carte cadc-carte--pleine" aria-label={t("stat.relances")}>
          <span className="chiffre__legende">{t("stat.relances")}</span>
          <span className="chiffre__valeur">{etat.relances_dues}</span>
          <span className="chiffre__aide">
            {etat.relances_en_retard} {t("carnet.en_retard")}
          </span>
        </section>

        <section className="cadc-carte" aria-label={t("stat.clients")}>
          <div className="cadc-tete">
            <h2>{t("stat.clients")}</h2>
          </div>
          <p className="cadc-stat__valeur">{etat.clients}</p>
          <p className="cadc-champ__aide">
            {t("stat.actifs")} {etat.actifs} · {t("stat.joignables")} {etat.joignables}
          </p>
          <p className="cadc-champ__aide">
            {t("stat.sans_numero")} {etat.actifs - etat.joignables}
          </p>
        </section>

        <section className="cadc-carte" aria-label={t("stat.30j")}>
          <div className="cadc-tete">
            <h2>{t("stat.30j")}</h2>
          </div>
          <p className="cadc-stat__valeur">{etat.echanges_30j}</p>
          <p className="cadc-champ__aide">
            {t("stat.devis")} {etat.devis_30j} · {t("stat.commandes")} {f.court(etat.commandes_30j)}
          </p>
        </section>
      </div>

      <section className="cadc-carte" aria-label={t("carnet.titre")}>
        <div className="cadc-tete">
          <h2>{t("carnet.titre")}</h2>
          <span className="cadc-tete__cote">{relances.length}</span>
        </div>

        {relances.length === 0 ? (
          <p className="cadc-note cadc-note--vert">
            {etat.silencie > 0 ? t("carnet.rien_rappeler") : t("carnet.tous_rappelles")}
          </p>
        ) : (
          <div className="file">
            {relances.map((relance) => (
              <Link
                key={relance.id}
                href={`/clients/${relance.client_id}`}
                className={`due${relance.retard > 0 ? " due--retard" : ""}${
                  relance.origine === "devis" ? " due--devis" : ""
                }`}
              >
                <span className="due__rail" aria-hidden />
                <span>
                  <span className="due__nom">{relance.client}</span>
                  <span className="due__motif">
                    {relance.origine === "devis" && !relance.motif
                      ? t("relance.devis")
                      : relance.motif}
                  </span>
                </span>
                <span className="due__cote">
                  {f.date(relance.due_le)}
                  <br />
                  <span className={relance.retard > 0 ? "cadc-badge cadc-badge--rouge" : ""}>
                    {retard(relance.retard, t)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}

        {file.a_venir.length > 0 ? (
          <>
            <div className="dite" style={{ marginTop: 16 }}>
              <span>{t("carnet.prochain")}</span>
            </div>
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              {file.a_venir.slice(0, 4).map((relance) => (
                <li className="cadc-ligne" key={relance.id}>
                  <span className="cadc-ligne__nom">
                    <Link href={`/clients/${relance.client_id}`}>{relance.client}</Link>
                    <small>
                      {relance.origine === "devis" && !relance.motif
                        ? t("relance.devis")
                        : relance.motif}
                    </small>
                  </span>
                  <span className="cadc-ligne__valeur">
                    {f.date(relance.due_le)} ·{" "}
                    {t("relance.dans", { n: f.joursEntre(etat.jour, relance.due_le) })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <section className="cadc-carte" aria-label={t("carnet.silence_titre")}>
        <div className="cadc-tete">
          <h2>{t("carnet.silence_titre")}</h2>
          <span className="cadc-tete__cote">{oublies.total}</span>
        </div>
        <p className="cadc-champ__aide">
          {t("carnet.silence_aide", { n: oublies.seuil })}
        </p>
        {oublies.clients.length === 0 ? (
          <p className="cadc-note cadc-note--vert" style={{ marginTop: 10 }}>
            {t("carnet.tous_rappelles")}
          </p>
        ) : (
          <ul className="cadc-liste cadc-pile cadc-pile--serree" style={{ marginTop: 10 }}>
            {oublies.clients.slice(0, 5).map((client) => (
              <li className="cadc-ligne" key={client.id}>
                <span className="cadc-ligne__nom">
                  <Link href={`/clients/${client.id}`}>{client.nom}</Link>
                  <small>
                    {client.quartier || client.segment} · {client.operateur}
                  </small>
                </span>
                <span className="cadc-ligne__valeur">
                  {client.derniers_jours === null
                    ? t("fiche.jamais")
                    : t("fiche.silence", { n: client.derniers_jours })}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <Link href="/silence" className="cadc-bouton cadc-bouton--petit">
            {t("nav.silence")}
          </Link>
          <Link href="/clients" className="cadc-bouton cadc-bouton--doux cadc-bouton--petit">
            {t("nav.clients")}
          </Link>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
