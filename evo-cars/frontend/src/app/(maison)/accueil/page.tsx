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
  return { title: langue === "en" ? "The garage" : "Le garage" };
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
        <div className="portail" aria-label={t("accueil.en_vente")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.en_vente}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.en_vente")} · {etat.reserve} {t("accueil.reserve")} · {etat.vendues} {t("accueil.vendues")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.clients} {t("accueil.clients")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.vendues_mois")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.vendues_mois}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.vendues_mois")}</span>
          </span>
          <span className="portail__reste">
            {t("accueil.mois")} · {f.court(etat.valeur_vendue_mois)}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.pieces")}>
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
            {t("accueil.stock")} {f.court(etat.valeur_pieces)}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/voitures" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouveau")}
        </Link>
        <Link href="/pieces" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.piece")}
        </Link>
        <a href="/catalogue" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.catalogue")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.pieces")}>
        <div className="cadc-tete">
          <h2>{t("accueil.pieces")}</h2>
          <span className="cadc-tete__cote">
            {etat.pieces} {t("accueil.pieces")} · {etat.pieces_vendues_mois} {t("accueil.pieces_mois")}
          </span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.pieces_encaisse")} {f.court(etat.encaisse_pieces_mois)}
        </p>
      </section>

      <section className="cadc-carte" aria-label={t("accueil.catalogue")}>
        <div className="cadc-tete">
          <h2>{t("accueil.catalogue")}</h2>
          <span className="cadc-tete__cote">{etat.en_vente} {t("accueil.en_vente")} · {etat.en_stock} {t("accueil.en_stock")}</span>
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
