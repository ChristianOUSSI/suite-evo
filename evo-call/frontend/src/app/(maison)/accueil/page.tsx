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

function duree(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  if (minutes === 0) return `${reste} s`;
  return reste ? `${minutes} min ${reste} s` : `${minutes} min`;
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
        <div className="portail" aria-label={t("accueil.en_file")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
                color: etat.en_file > 0 ? "var(--cadc-rouge)" : undefined,
              }}
            >
              {etat.en_file}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.en_file")} · {etat.en_cours} {t("accueil.en_cours")} · {etat.rappels} {t("accueil.rappels")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.du_jour} {t("accueil.du_jour")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.termines")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.termines_jour}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.termines")} · {etat.sans_reponse_jour} {t("accueil.sans_reponse")}
            </span>
          </span>
          <span className="portail__reste">
            {t("accueil.duree")} · {duree(etat.duree_moyenne_jour)}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/appels" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouveau")}
        </Link>
        <Link href="/rappels" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.rappels_page")}
        </Link>
        <a href="/file" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.file")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.file")}>
        <div className="cadc-tete">
          <h2>{t("accueil.file")}</h2>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.file-aide")}
        </p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href="/file" target="_blank" rel="noreferrer">
            {t("commun.whatsapp")} · /file
          </a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
