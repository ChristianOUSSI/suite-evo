import type { Metadata } from "next";

import { CommandesGerant } from "@/components/commandes-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeAnnonces, ListeCommandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Orders" : "Les commandes" };
}

export default async function PageCommandes({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const requete = new URLSearchParams();
  if (params.statut) requete.set("statut", params.statut);
  const [commandes, annonces] = await Promise.all([
    lire<ListeCommandes>(`/commandes${requete.size ? `?${requete}` : ""}`, langue),
    lire<ListeAnnonces>("/annonces", langue),
  ]);

  return (
    <div className="cadc-gabarit marche">
      <div className="marche__tete">
        <span className="cadc-badge cadc-badge--acier">
          {commandes.commandes.length} {t("commandes.titre").toLowerCase()}
        </span>
        <h1>{t("commandes.titre")}</h1>
        <p>{t("commandes.chapo")}</p>
      </div>

      <CommandesGerant commandes={commandes.commandes} annonces={annonces.annonces} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
