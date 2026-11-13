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
    <div className="cadc-gabarit immo">
      <div className="immo__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.biens")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.biens}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.biens")} · {etat.disponibles} {t("accueil.disponibles")} · {etat.negociations} {t("accueil.negociations")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.vendus_loues} {t("accueil.vendus")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.demandes")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.demandes_neuves}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.demandes")}</span>
          </span>
          <span className="portail__reste">
            {etat.visites_aujourdhui} {t("accueil.visites")} · {etat.demandes_mois} {t("recap.demandes")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/biens" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.ajouter")}
        </Link>
        <Link href="/demandes" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.demande")}
        </Link>
        <Link href="/visites" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.visite")}
        </Link>
        <a href="/annonces" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.annonces")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.annonces")}>
        <div className="cadc-tete">
          <h2>{t("accueil.annonces")}</h2>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.annonces-aide")}
        </p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href="/annonces" target="_blank" rel="noreferrer">
            {t("annonces.partager")} · /annonces
          </a>
        </div>
      </section>

      <section className="cadc-carte" aria-label={t("accueil.ventes")}>
        <div className="cadc-tete">
          <h2>{t("accueil.ventes")}</h2>
        </div>
        <p className="cadc-note cadc-note--acier">
          {f.fcfa(etat.ventes_mois)} · {etat.visites_mois} {t("recap.visites")}
        </p>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
