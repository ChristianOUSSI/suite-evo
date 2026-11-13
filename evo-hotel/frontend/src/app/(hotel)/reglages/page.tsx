import type { Metadata } from "next";

import { Comptes } from "@/components/comptes";
import { Deconnexion } from "@/components/deconnexion";
import { MentionDemo } from "@/components/mention-demo";
import { ReglagesMaison } from "@/components/reglages-maison";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Compte } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Settings" : "Les réglages" };
}

export default async function PageReglages() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const responsable = session.user.role === "responsable";

  const comptes = await lire<Compte[]>("/comptes", langue);

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="hotel__tete">
        <span className="cadc-badge cadc-badge--acier">
          {t("reglages.comptes")} · {comptes.length}
        </span>
        <h1>{t("reglages.titre")}</h1>
        <p>{t("reglages.chapo")}</p>
      </div>

      <section className="cadc-carte cadc-carte--premiere" aria-label={t("reglages.maison")}>
        <div className="cadc-tete">
          <h2>{t("reglages.maison")}</h2>
        </div>
        <ReglagesMaison
          organisation={session.organisation}
          langue={langue}
          responsable={responsable}
        />
      </section>

      <section className="cadc-carte" aria-label={t("reglages.comptes")}>
        <div className="cadc-tete">
          <h2>{t("reglages.comptes")}</h2>
        </div>
        <Comptes comptes={comptes} langue={langue} responsable={responsable} />
      </section>

      <section className="cadc-carte" aria-label={t("reglages.exports")}>
        <div className="cadc-tete">
          <h2>{t("reglages.exports")}</h2>
          <span className="cadc-tete__cote">CSV</span>
        </div>
        <p className="cadc-champ__aide">{t("reglages.exports-aide")}</p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton" href="/api/exports/chambres.csv" download>
            {t("nav.chambres")} · CSV
          </a>
          <a className="cadc-bouton" href="/api/exports/clients.csv" download>
            {t("nav.clients")} · CSV
          </a>
          <a className="cadc-bouton" href="/api/exports/sejours.csv" download>
            {t("nav.sejours")} · CSV
          </a>
          <a className="cadc-bouton" href="/api/exports/recap.csv" download>
            {t("nav.recap")} · CSV
          </a>
        </div>
      </section>

      <section className="cadc-carte" aria-label={t("commun.sortir")}>
        <div className="cadc-tete">
          <h2>{t("commun.sortir")}</h2>
          <span className="cadc-tete__cote">
            {session.user.nom} · {t(`role.${session.user.role}`)}
          </span>
        </div>
        <Deconnexion langue={langue} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
