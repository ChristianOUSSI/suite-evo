import type { Metadata } from "next";

import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeExecutions } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The journal" : "Le journal" };
}

export default async function PageExecutions() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);

  const liste = await lire<ListeExecutions>("/executions", langue);

  function secondes(total: number): string {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m ? `${m} min ${s} s` : `${s} s`;
  }

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{liste.total} {t("executions.total")}</span>
        <h1>{t("executions.titre")}</h1>
        <p>{t("executions.chapo")}</p>
      </div>

      <ul className="standard-grille">
        {liste.executions.map((execution) => (
          <li className="appel" key={execution.id}>
            <div className="appel__cat">
              {execution.statut === "terminee" ? t("tstatut.terminee") : t("tstatut.echec")}
            </div>
            <div className="appel__titre">{execution.tache || `#${execution.tache_id}`}</div>
            <div className="appel__prix">
              {secondes(execution.duree_secondes)}
            </div>
            {execution.debut_le ? (
              <div className="appel__lieu">
                {t("executions.debut")} {f.heure(execution.debut_le)} ·{" "}
                {t("executions.fin")} {execution.fin_le ? f.heure(execution.fin_le) : "—"}
              </div>
            ) : (
              <div className="appel__lieu">{t("executions.manuel")}</div>
            )}
            {execution.resultat ? <p className="appel__description">{execution.resultat}</p> : null}
            {execution.details ? <p className="appel__description">{execution.details}</p> : null}
          </li>
        ))}
      </ul>
      {!liste.executions.length ? <p className="cadc-note">{t("commun.aucun")}</p> : null}
    </div>
  );
}
