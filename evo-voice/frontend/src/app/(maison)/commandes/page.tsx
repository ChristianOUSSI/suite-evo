import type { Metadata } from "next";

import { CommandesGerant } from "@/components/commandes-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeCommandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The commands" : "Les commandes" };
}

export default async function PageCommandes({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; intention?: string; recherche?: string }>;
}) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const qs = new URLSearchParams();
  for (const cle of ["statut", "intention", "recherche"] as const) {
    const valeur = params[cle];
    if (valeur) qs.set(cle, valeur);
  }
  const suffixe = qs.toString() ? `?${qs.toString()}` : "";
  const liste = await lire<ListeCommandes>(`/commandes${suffixe}`, langue);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.total} {t("nav.commandes")}
        </span>
        <h1>{t("commandes.titre")}</h1>
        <p>{t("commandes.chapo")}</p>
      </div>

      <CommandesGerant commandes={liste.commandes} langue={langue} />
    </div>
  );
}
