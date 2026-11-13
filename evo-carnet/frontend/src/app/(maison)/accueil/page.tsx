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
  return { title: langue === "en" ? "The notebook" : "Le carnet" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);

  const cartes = [
    { cle: "accueil.notes", valeur: etat.notes, aide: `${etat.archivees} ${t("accueil.archivees")}` },
    { cle: "accueil.epinglees", valeur: etat.epinglees, aide: `${etat.categories} ${t("accueil.categories")}` },
    { cle: "accueil.mots", valeur: etat.mots, aide: `${etat.notes} ${t("accueil.notes")}` },
    { cle: "accueil.categories", valeur: etat.categories, aide: f.jourDate(etat.jour) },
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
        <Link href="/notes" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouvelle")}
        </Link>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.partage")}>
        <div className="cadc-tete">
          <h2>{t("accueil.partage")}</h2>
          <span className="cadc-tete__cote">/partage/CODE</span>
        </div>
        <p className="cadc-note cadc-note--acier">
          {t("accueil.partage-aide")}
        </p>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
