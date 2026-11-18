import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Etat, ListeExecutions } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The agent" : "L'agent" };
}

export default async function PageAccueil() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const etat = await lire<Etat>("/etat", langue);
  const journal = await lire<ListeExecutions>("/executions", langue);

  const cartes = [
    { cle: "accueil.taches", valeur: etat.taches, aide: `${etat.en_attente} ${t("accueil.en_attente")}` },
    { cle: "accueil.en_cours", valeur: etat.en_cours, aide: `${etat.haute_priorite} ${t("accueil.haute")}` },
    { cle: "accueil.terminees", valeur: etat.terminees, aide: `${etat.echecs} ${t("tstatut.echec")}` },
    { cle: "accueil.executions", valeur: etat.executions, aide: `${etat.executions_mois} ${t("accueil.executions_mois")}` },
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
        <Link href="/taches" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.nouvelle")}
        </Link>
      </div>

      <section className="cadc-carte" aria-label={t("accueil.journal")}>
        <div className="cadc-tete">
          <h2>{t("accueil.journal")}</h2>
          <span className="cadc-tete__cote">{journal.total} {t("executions.total")}</span>
        </div>
        <p className="cadc-note cadc-note--acier">{t("accueil.journal-aide")}</p>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {journal.executions.slice(0, 5).map((execution) => (
            <li className="cadc-ligne" key={execution.id}>
              <span className="cadc-ligne__nom">{execution.tache}</span>
              <span className="cadc-ligne__valeur">{execution.duree_secondes} {t("executions.duree")}</span>
            </li>
          ))}
        </ul>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
