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
  return { title: langue === "en" ? "The depot" : "Le dépôt" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);

  const cartes = [
    { cle: "accueil.en_cours", valeur: etat.en_cours, aide: `${etat.commandees} ${t("accueil.commandees")} · ${etat.en_route} ${t("accueil.en_route")}` },
    { cle: "accueil.du_jour", valeur: etat.du_jour, aide: `${etat.livrees_mois} ${t("accueil.livrees_mois")}` },
    { cle: "accueil.bonbonnes", valeur: etat.bonbonnes_mois, aide: `${etat.livrees_mois} ${t("accueil.livrees_mois")}` },
    { cle: "accueil.mois", valeur: f.court(etat.montant_mois), aide: `${etat.clients} ${t("accueil.clients")}` },
  ];

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{f.jourDate(etat.jour)}</span>
        <h1>{t("accueil.titre")}</h1>
        <p>{t("accueil.chapo")}</p>
      </div>

      <div className="portails">
        {cartes.map((carte) => (
          <div className="portail" key={carte.cle} aria-label={t(carte.cle)}>
            <span>
              <strong
                style={{
                  display: "block",
                  fontFamily: "var(--cadc-mono)",
                  fontSize: "clamp(1.9rem,8vw,2.8rem)",
                  lineHeight: 1.1,
                }}
              >
                {carte.valeur}
              </strong>
              <span className="cadc-champ__aide">{t(carte.cle)}</span>
            </span>
            <span className="portail__reste">{carte.aide}</span>
          </div>
        ))}
      </div>

      <div className="cadc-acts">
        <Link href="/livraisons" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouvelle")}
        </Link>
        <a href="/commander" target="_blank" rel="noreferrer" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.commander")}
        </a>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.livraisons")}>
        <div className="cadc-tete">
          <h2>{t("accueil.livraisons")}</h2>
          <span className="cadc-tete__cote">{etat.livraisons}</span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {etat.en_cours} {t("accueil.en_cours")} · {etat.clients} {t("accueil.clients")}
        </p>
      </section>

      <section className="cadc-carte" aria-label={t("accueil.commander")}>
        <div className="cadc-tete">
          <h2>{t("accueil.commander")}</h2>
          <span className="cadc-tete__cote">/commander</span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.commander-aide")}
        </p>
        <div className="cadc-acts" style={{ marginTop: 12 }}>
          <a className="cadc-bouton cadc-bouton--doux" href="/commander" target="_blank" rel="noreferrer">
            {t("commun.whatsapp")} · /commander
          </a>
        </div>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
