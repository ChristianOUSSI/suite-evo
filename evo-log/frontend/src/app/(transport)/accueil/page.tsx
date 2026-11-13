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
  return { title: langue === "en" ? "The desk" : "L'accueil" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);

  return (
    <div className="cadc-gabarit log">
      <div className="log__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.colis")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.colis}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.colis")} · {etat.en_transit} {t("accueil.en_transit")} · {etat.arrives} {t("accueil.arrives")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.deposes_mois} {t("accueil.deposes")} · {etat.distribues_mois} {t("accueil.distribues")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.frais")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {f.fcfa(etat.frais_mois)}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.frais")}</span>
          </span>
          <span className="portail__reste">
            {f.fcfa(etat.a_percevoir)} {t("accueil.reste")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/colis" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.ajouter")}
        </Link>
        <a href="/suivi" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.suivi")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.suivi")}>
        <div className="cadc-tete">
          <h2>{t("accueil.suivi")}</h2>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.suivi-aide")}
        </p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href="/suivi" target="_blank" rel="noreferrer">
            {t("commun.whatsapp")} · /suivi
          </a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
