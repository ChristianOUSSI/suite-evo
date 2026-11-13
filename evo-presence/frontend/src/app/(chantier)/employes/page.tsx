import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { EmployesGerant } from "@/components/employes-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeEmployes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Staff" : "Les employés" };
}

export default async function PageEmployes() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const liste = await lire<ListeEmployes>("/employes", langue);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit chantier">
      <div className="chantier__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.actifs} {t("employes.dans")} · {liste.total - liste.actifs} {t("employes.sorti")}
        </span>
        <h1>{t("employes.titre")}</h1>
        <p>{t("employes.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("employes.ajouter")}>
        <div className="cadc-tete">
          <h2>{t("employes.ajouter")}</h2>
        </div>
        {liste.employes.length === 0 ? <p className="cadc-note">{t("employes.vide")}</p> : null}
        <EmployesGerant employes={liste.employes} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
