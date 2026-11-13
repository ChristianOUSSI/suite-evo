import type { Metadata } from "next";

import { EncaisserGerant } from "@/components/encaisser-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeEleves, ListeVersements } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Payments" : "Les versements" };
}

export default async function PageCaisse() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [versements, eleves] = await Promise.all([
    lire<ListeVersements>("/versements", langue),
    lire<ListeEleves>("/eleves", langue),
  ]);

  return (
    <div className="cadc-gabarit ecole">
      <div className="ecole__tete">
        <span className="cadc-badge cadc-badge--acier">
          {versements.versements.length} {t("nav.caisse")}
        </span>
        <h1>{t("caisse.titre")}</h1>
        <p>{t("caisse.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("caisse.titre")}>
        <EncaisserGerant versements={versements.versements} eleves={eleves.eleves} langue={langue} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
