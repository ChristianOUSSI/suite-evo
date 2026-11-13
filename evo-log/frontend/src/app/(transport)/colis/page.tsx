import type { Metadata } from "next";

import { ColisGerant } from "@/components/colis-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeColis } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Parcels" : "Les colis" };
}

export default async function PageColis({ searchParams }: { searchParams: Promise<{ statut?: string; recherche?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const requete = new URLSearchParams();
  if (params.statut) requete.set("statut", params.statut);
  if (params.recherche) requete.set("recherche", params.recherche);
  const corps = await lire<ListeColis>(`/colis${requete.size ? `?${requete}` : ""}`, langue);

  return (
    <div className="cadc-gabarit log">
      <div className="log__tete">
        <span className="cadc-badge cadc-badge--acier">
          {corps.total} · {corps.en_transit} {t("accueil.en_transit")}
        </span>
        <h1>{t("colis.titre")}</h1>
        <p>{t("colis.chapo")}</p>
      </div>

      <ColisGerant colis={corps.colis} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
