import type { Metadata } from "next";

import { ChambresGerant } from "@/components/chambres-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeChambres } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Rooms" : "Les chambres" };
}

export default async function PageChambres() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const liste = await lire<ListeChambres>("/chambres", langue);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit hotel">
      <div className="hotel__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.actives}/{liste.total} {t("chambres.actives")}
        </span>
        <h1>{t("chambres.titre")}</h1>
        <p>{t("chambres.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("chambres.titre")}>
        <ChambresGerant chambres={liste.chambres} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
