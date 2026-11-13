import type { Metadata } from "next";

import { BiensGerant } from "@/components/biens-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeBiens } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Properties" : "Les biens" };
}

export default async function PageBiens({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const corps = await lire<ListeBiens>(
    params.statut ? `/biens?statut=${encodeURIComponent(params.statut)}` : "/biens",
    langue,
  );

  return (
    <div className="cadc-gabarit immo">
      <div className="immo__tete">
        <span className="cadc-badge cadc-badge--acier">
          {corps.total} · {corps.disponibles} {t("accueil.disponibles")}
        </span>
        <h1>{t("biens.titre")}</h1>
        <p>{t("biens.chapo")}</p>
      </div>

      <BiensGerant biens={corps.biens} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
