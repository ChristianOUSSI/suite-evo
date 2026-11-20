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
    <div className="cadc-gabarit classeur">
      <div className="classeur__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        <div className="portail" aria-label={t("accueil.documents")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {etat.actifs}
            </strong>
            <span className="cadc-champ__aide">
              {t("accueil.actifs")} · {etat.documents} {t("accueil.documents")} · {etat.archives} {t("statut.archive")}
            </span>
          </span>
          <span className="portail__reste">
            {etat.avec_echeance} {t("accueil.echeance")}
          </span>
        </div>
        <div className="portail" aria-label={t("accueil.retard")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
                color: etat.en_retard > 0 ? "var(--cadc-rouge)" : undefined,
              }}
            >
              {etat.en_retard}
            </strong>
            <span className="cadc-champ__aide">{t("accueil.retard")}</span>
          </span>
          <span className="portail__reste">
            {etat.a_venir_30j} {t("accueil.proche")}
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/documents" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.ajouter")}
        </Link>
        <Link href="/echeances" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.echeances")}
        </Link>
        <a href="/verifier" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.verifier")}
        </a>
        <Link href="/demandes" className="cadc-bouton cadc-bouton--doux">
          {t("nav.demandes")}
        </Link>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.verifier")}>
        <div className="cadc-tete">
          <h2>{t("accueil.verifier")}</h2>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.verifier-aide")}
        </p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href="/verifier" target="_blank" rel="noreferrer">
            {t("commun.whatsapp")} · /verifier
          </a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
