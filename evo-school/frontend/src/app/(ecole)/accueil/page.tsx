import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The office" : "La caisse" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);

  return (
    <div className="cadc-gabarit ecole">
      <div className="ecole__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.ca")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {f.fcfa(etat.ca_mois)}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.ca")} · {etat.encaisses} {t("accueil.encaisses")}
            </span>
          </span>
          <span className="portail__reste">
            {f.fcfa(etat.reste_total)} {t("accueil.reste")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/caisse" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("caisse.nouveau")}
        </Link>
        <Link href="/eleves?restants=1" className="cadc-bouton cadc-bouton--doux">
          {t("eleves.restants")}
        </Link>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.eleves")}>
        <div className="cadc-tete">
          <h2>{t("accueil.eleves")}</h2>
          <span className="cadc-tete__cote">
            {etat.eleves} · {etat.classes} {t("accueil.classes")}
          </span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.total")} : {f.fcfa(etat.ca_total)}
        </p>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
