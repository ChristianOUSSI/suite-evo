import type { Metadata } from "next";

import { DocumentsGerant } from "@/components/documents-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeDocuments } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Documents" : "Les documents" };
}

export default async function PageDocuments({ searchParams }: { searchParams: Promise<{ categorie?: string; statut?: string; echeance?: string; recherche?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const params = await searchParams;

  const requete = new URLSearchParams();
  if (params.categorie) requete.set("categorie", params.categorie);
  if (params.statut) requete.set("statut", params.statut);
  if (params.echeance) requete.set("echeance", params.echeance);
  if (params.recherche) requete.set("recherche", params.recherche);
  const corps = await lire<ListeDocuments>(`/documents${requete.size ? `?${requete}` : ""}`, langue);

  return (
    <div className="cadc-gabarit classeur">
      <div className="classeur__tete">
        <span className="cadc-badge cadc-badge--acier">
          {corps.total} · {corps.actifs} {t("accueil.actifs")}
          {corps.en_retard ? ` · ${corps.en_retard} ${t("accueil.retard")}` : ""}
        </span>
        <h1>{t("documents.titre")}</h1>
        <p>{t("documents.chapo")}</p>
      </div>

      <DocumentsGerant documents={corps.documents} langue={langue} />

      <MentionDemo langue={langue} />
    </div>
  );
}
