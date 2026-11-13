import type { Metadata } from "next";

import { MotosGerant } from "@/components/motos-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients, ListeMotos } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Bikes" : "Les motos" };
}

export default async function PageMotos() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients] = await Promise.all([
    lire<ListeMotos>("/motos", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.motos")}</span>
        <h1>{t("motos.titre")}</h1>
        <p>{t("motos.chapo")}</p>
      </div>

      <MotosGerant motos={corps.motos} clients={clients.clients} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
