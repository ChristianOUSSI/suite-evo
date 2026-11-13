import type { Metadata } from "next";

import { Comptes } from "@/components/comptes";
import { Deconnexion } from "@/components/deconnexion";
import { MentionDemo } from "@/components/mention-demo";
import { ReglagesGroupe } from "@/components/reglages-groupe";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
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
  const f = formats(langue);
  const gestion = session.user.role !== "membre";

  const comptes = await lire<Compte[]>("/comptes", langue);

  return (
    <div className="cadc-gabarit cadc-pile">
      <div className="cercle__tete">
        <span className="cadc-badge cadc-badge--acier">
          {t("reglages.comptes")} · {comptes.length}
        </span>
        <h1>{t("reglages.titre")}</h1>
        <p>{t("reglages.chapo")}</p>
      </div>

      <section className="cadc-carte cadc-carte--premiere" aria-label={t("reglages.groupe")}>
        <div className="cadc-tete">
          <h2>{t("reglages.groupe")}</h2>
          <span className="cadc-tete__cote">
            {t("reglages.cotisation")} {f.fcfa(session.groupe.cotisation)}
          </span>
        </div>
        <ReglagesGroupe groupe={session.groupe} langue={langue} gestion={gestion} />
      </section>

      <section className="cadc-carte" aria-label={t("reglages.comptes")}>
        <div className="cadc-tete">
          <h2>{t("reglages.comptes")}</h2>
        </div>
        <Comptes comptes={comptes} langue={langue} gestion={gestion} />
      </section>

      <section className="cadc-carte" aria-label={t("reglages.exports")}>
        <div className="cadc-tete">
          <h2>{t("reglages.exports")}</h2>
          <span className="cadc-tete__cote">CSV</span>
        </div>
        <p className="cadc-champ__aide">{t("reglages.exports-aide")}</p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton" href="/api/exports/tours.csv" download>
            {t("nav.tours")} · CSV
          </a>
          <a className="cadc-bouton" href="/api/exports/cotisations.csv" download>
            {t("nav.membres")} · CSV
          </a>
          <a className="cadc-bouton" href="/api/exports/remises.csv" download>
            {t("tour.remettre")} · CSV
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
