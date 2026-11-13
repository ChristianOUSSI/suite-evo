import type { Metadata } from "next";

import { DemandesGerant } from "@/components/demandes-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeBiens, ListeDemandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Requests" : "Les demandes" };
}

export default async function PageDemandes() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, biens] = await Promise.all([
    lire<ListeDemandes>("/demandes", langue),
    lire<ListeBiens>("/biens", langue),
  ]);

  return (
    <div className="cadc-gabarit immo">
      <div className="immo__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.demandes.length}</span>
        <h1>{t("demandes.titre")}</h1>
        <p>{t("demandes.chapo")}</p>
      </div>

      <DemandesGerant demandes={corps.demandes} biens={biens.biens} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
