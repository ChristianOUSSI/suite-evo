import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { VisitesGerant } from "@/components/visites-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeBiens, ListeVisites } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Visits" : "Les visites" };
}

export default async function PageVisites({ searchParams }: { searchParams: Promise<{ jour?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const [corps, biens] = await Promise.all([
    lire<ListeVisites>(params.jour ? `/visites?jour=${encodeURIComponent(params.jour)}` : "/visites", langue),
    lire<ListeBiens>("/biens", langue),
  ]);

  return (
    <div className="cadc-gabarit immo">
      <div className="immo__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.visites.length}</span>
        <h1>{t("visites.titre")}</h1>
        <p>{t("visites.chapo")}</p>
      </div>

      <VisitesGerant visites={corps.visites} biens={biens.biens} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
