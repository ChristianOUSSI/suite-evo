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
  return { title: langue === "en" ? "The boutique" : "La boutique" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.en_stock")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.en_stock}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.en_stock")} · {etat.epuisees} {t("accueil.epuisees")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.unites_stock} {t("recap.unites")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.vendus_mois")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.vendus_mois}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.vendus_mois")}</span>
          </span>
          <span className="portail__reste">
            {etat.quantite_vendue_mois} {t("accueil.quantite")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.mois")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {f.court(etat.encaisse_mois)}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.mois")}</span>
          </span>
          <span className="portail__reste">
            {etat.clients} {t("accueil.clients")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/articles" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouveau")}
        </Link>
        <a href="/catalogue" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.catalogue")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.stock")}>
        <div className="cadc-tete">
          <h2>{t("accueil.stock")}</h2>
          <span className="cadc-tete__cote">{etat.articles} {t("accueil.articles")}</span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {f.court(etat.valeur_stock)}
        </p>
      </section>

      <section className="cadc-carte" aria-label={t("accueil.catalogue")}>
        <div className="cadc-tete">
          <h2>{t("accueil.catalogue")}</h2>
          <span className="cadc-tete__cote">{etat.en_stock} {t("accueil.en_stock")}</span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.catalogue-aide")}
        </p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href="/catalogue" target="_blank" rel="noreferrer">
            {t("commun.whatsapp")} · /catalogue
          </a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
