import type { Metadata } from "next";

import { CaisseGerant } from "@/components/caisse-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeProduits, ListeVentes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Receipts" : "Les tickets" };
}

export default async function PageVentes() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [ventes, produits] = await Promise.all([
    lire<ListeVentes>("/ventes", langue),
    lire<ListeProduits>("/produits", langue),
  ]);

  return (
    <div className="cadc-gabarit boutique">
      <div className="boutique__tete">
        <span className="cadc-badge cadc-badge--acier">
          {ventes.ventes.length} {t("nav.ventes")}
        </span>
        <h1>{t("ventes.titre")}</h1>
        <p>{t("ventes.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("ventes.titre")}>
        <CaisseGerant ventes={ventes.ventes} produits={produits.produits} langue={langue} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
