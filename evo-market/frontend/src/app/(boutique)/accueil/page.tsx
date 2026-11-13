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
    <div className="cadc-gabarit marche">
      <div className="marche__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.annonces")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.en_ligne}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.en_ligne")} · {etat.annonces} {t("accueil.annonces")} · {etat.ruptures} {t("accueil.ruptures")} · {etat.stock_total}
            </span>
          </span>
          <span className="portail__reste">
            {etat.commandes_neuves} {t("accueil.neuves")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.ventes")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {f.fcfa(etat.ventes_mois)}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.ventes")}</span>
          </span>
          <span className="portail__reste">
            {etat.commandes_mois} {t("accueil.commandes_mois")} · {f.fcfa(etat.ventes_total)} {t("accueil.total")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/annonces" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.ajouter")}
        </Link>
        <Link href="/commandes" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.commander")}
        </Link>
        <a href="/catalogue" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.publique")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.publique")}>
        <div className="cadc-tete">
          <h2>{t("accueil.publique")}</h2>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.publique-aide")}
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
