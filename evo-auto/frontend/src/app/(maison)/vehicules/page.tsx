import type { Metadata } from "next";

import { VehiculesGerant } from "@/components/vehicules-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeClients, ListeVehicules } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Vehicles" : "Les véhicules" };
}

export default async function PageVehicules() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, clients] = await Promise.all([
    lire<ListeVehicules>("/vehicules", langue),
    lire<ListeClients>("/clients", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.vehicules")}</span>
        <h1>{t("vehicules.titre")}</h1>
        <p>{t("vehicules.chapo")}</p>
      </div>

      <VehiculesGerant vehicules={corps.vehicules} clients={clients.clients} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
