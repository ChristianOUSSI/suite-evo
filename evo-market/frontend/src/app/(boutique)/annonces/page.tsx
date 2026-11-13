import type { Metadata } from "next";

import { AnnoncesGerant } from "@/components/annonces-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeAnnonces } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Listings" : "Les annonces" };
}

export default async function PageAnnonces({ searchParams }: { searchParams: Promise<{ categorie?: string; statut?: string; recherche?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const requete = new URLSearchParams();
  if (params.categorie) requete.set("categorie", params.categorie);
  if (params.statut) requete.set("statut", params.statut);
  if (params.recherche) requete.set("recherche", params.recherche);
  const corps = await lire<ListeAnnonces>(`/annonces${requete.size ? `?${requete}` : ""}`, langue);

  return (
    <div className="cadc-gabarit marche">
      <div className="marche__tete">
        <span className="cadc-badge cadc-badge--acier">
          {corps.total} · {corps.en_ligne} {t("accueil.en_ligne")}
        </span>
        <h1>{t("annonces.titre")}</h1>
        <p>{t("annonces.chapo")}</p>
      </div>

      <AnnoncesGerant annonces={corps.annonces} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
