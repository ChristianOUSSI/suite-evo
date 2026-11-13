import type { Metadata } from "next";

import { AppelsGerant } from "@/components/appels-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Compte, ListeAppels } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Calls" : "Les appels" };
}

export default async function PageAppels() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, comptes] = await Promise.all([
    lire<ListeAppels>("/appels", langue),
    lire<Compte[]>("/comptes", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.appels")}</span>
        <h1>{t("appels.titre")}</h1>
        <p>{t("appels.chapo")}</p>
      </div>

      <AppelsGerant appels={corps.appels} comptes={comptes} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
