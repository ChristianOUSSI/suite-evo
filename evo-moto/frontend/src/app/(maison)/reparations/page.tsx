import type { Metadata } from "next";

import { ReparationsGerant } from "@/components/reparations-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients, ListeMotos, ListeReparations } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Repairs" : "Les réparations" };
}

export default async function PageReparations() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients, motos] = await Promise.all([
    lire<ListeReparations>("/reparations", langue),
    lire<ListeClients>("/clients", langue),
    lire<ListeMotos>("/motos", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.reparations")}</span>
        <h1>{t("rep.titre")}</h1>
        <p>{t("rep.chapo")}</p>
      </div>

      <ReparationsGerant reparations={corps.reparations} clients={clients.clients} motos={motos.motos} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
