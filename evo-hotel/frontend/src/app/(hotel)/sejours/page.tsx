import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { SejoursGerant } from "@/components/sejours-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeChambres, ListeClients, ListeSejours } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Stays" : "Les séjours" };
}

export default async function PageSejours() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [sejours, chambres, clients] = await Promise.all([
    lire<ListeSejours>("/sejours", langue),
    lire<ListeChambres>("/chambres", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit hotel">
      <div className="hotel__tete">
        <span className="cadc-badge cadc-badge--acier">
          {sejours.sejours.length} {t("nav.sejours")}
        </span>
        <h1>{t("sejours.titre")}</h1>
        <p>{t("sejours.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("sejours.titre")}>
        <SejoursGerant
          sejours={sejours.sejours}
          chambres={chambres.chambres}
          clients={clients.clients}
          langue={langue}
        />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
