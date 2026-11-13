import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { ProduitsGerant } from "@/components/produits-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeProduits } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Items" : "Les articles" };
}

export default async function PageProduits() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const liste = await lire<ListeProduits>("/produits", langue);
  const responsable = session.user.role === "responsable";

  return (
    <div className="cadc-gabarit boutique">
      <div className="boutique__tete">
        <span className="cadc-badge cadc-badge--acier">
          {liste.actifs}/{liste.total} {t("produits.nom").toLowerCase()}
        </span>
        <h1>{t("produits.titre")}</h1>
        <p>{t("produits.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("produits.nouveau")}>
        <ProduitsGerant produits={liste.produits} langue={langue} responsable={responsable} />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
