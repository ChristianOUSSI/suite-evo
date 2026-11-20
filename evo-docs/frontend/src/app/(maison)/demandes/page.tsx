import type { Metadata } from "next";
import Link from "next/link";

import { DemandesGerant } from "@/components/demandes-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeDemandes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Document requests" : "Les demandes" };
}

export default async function PageDemandes() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const corps = await lire<ListeDemandes>("/demandes", langue);
  const demandes = corps.demandes;

  return (
    <div className="cadc-gabarit classeur">
      <div className="classeur__tete">
        <span className="cadc-badge cadc-badge--acier">
          {demandes.filter((un) => un.statut === "demandee").length}{" "}
          {t("statutdemande.demandee").toLowerCase()}
        </span>
        <h1>{t("demandes.titre")}</h1>
        <p>{t("demandes.chapo")}</p>
      </div>

      <DemandesGerant
        demandes={demandes}
        langue={langue}
        peutGerer={session.user.role === "responsable"}
      />

      <div className="cadc-acts">
        <Link href="/demande" className="cadc-bouton cadc-bouton--doux" target="_blank">
          {t("demande.titre")}
        </Link>
      </div>

      <MentionDemo langue={langue} />
    </div>
  );
}
