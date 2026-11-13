import type { Metadata } from "next";

import { ArticlesGerant } from "@/components/articles-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeArticles, ListeClients } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Items" : "Les articles" };
}

export default async function PageArticles() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients] = await Promise.all([
    lire<ListeArticles>("/articles", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.articles")}</span>
        <h1>{t("articles.titre")}</h1>
        <p>{t("articles.chapo")}</p>
      </div>

      <ArticlesGerant articles={corps.articles} clients={clients.clients} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
