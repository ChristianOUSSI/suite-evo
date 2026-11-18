import type { Metadata } from "next";

import { TachesGerant } from "@/components/taches-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeTaches } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The tasks" : "Les tâches" };
}

export default async function PageTaches({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; type?: string; recherche?: string }>;
}) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const qs = new URLSearchParams();
  for (const cle of ["statut", "type", "recherche"] as const) {
    const valeur = params[cle];
    if (valeur) qs.set(cle, valeur);
  }
  const suffixe = qs.toString() ? `?${qs.toString()}` : "";
  const liste = await lire<ListeTaches>(`/taches${suffixe}`, langue);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.total} {t("executions.total")}
        </span>
        <h1>{t("taches.titre")}</h1>
        <p>{t("taches.chapo")}</p>
      </div>

      <TachesGerant taches={liste.taches} langue={langue}  />
    </div>
  );
}
