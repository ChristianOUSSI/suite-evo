import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeDocuments } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Deadlines" : "Les échéances" };
}

export default async function PageEcheances({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = await searchParams;

  const filtre = params.filtre ?? "";
  const requete = filtre ? `?echeance=${filtre}` : "";
  const corps = await lire<ListeDocuments>(`/documents${requete}`, langue);

  const lignes = corps.documents
    .filter((un) => un.echeance !== null)
    .sort((a, b) => (a.jours_restants ?? 9999) - (b.jours_restants ?? 9999));

  function libelle(un: { jours_restants: number | null; en_retard: boolean }): string {
    if (un.jours_restants === null) return "";
    if (un.jours_restants < 0) return t("echeances.depasse_de", { n: Math.abs(un.jours_restants) });
    if (un.jours_restants === 0) return t("echeances.aujourdhui");
    return t("echeances.dans", { n: un.jours_restants });
  }

  return (
    <div className="cadc-gabarit classeur">
      <div className="classeur__tete">
        <span className="cadc-badge cadc-badge--acier">{lignes.length}</span>
        <h1>{t("echeances.titre")}</h1>
        <p>{t("echeances.chapo")}</p>
      </div>

      <nav className="cadc-acts" aria-label={t("echeances.titre")}>
        {(["", "retard", "proche", "sans"] as const).map((un) => (
          <Link
            key={un || "toutes"}
            href={un ? `/echeances?filtre=${un}` : "/echeances"}
            className={`cadc-bouton cadc-bouton--petit${filtre === un ? " cadc-bouton--premier" : " cadc-bouton--doux"}`}
          >
            {un === "" ? t("echeances.toutes") : t(`echeances.${un}`)}
          </Link>
        ))}
      </nav>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {lignes.map((un) => (
          <li className={`cadc-ligne${un.en_retard ? " eleve--solde" : ""}`} key={un.id}>
            <span className="cadc-ligne__nom">
              {un.titre}
              <small>
                {un.reference} · {t(`categorie.${un.categorie}`)}
                {un.emetteur ? ` · ${un.emetteur}` : ""}
              </small>
              <small>{t("documents.echeance")} : {f.jourDate(un.echeance as string)}</small>
            </span>
            <span className="cadc-ligne__valeur">
              <strong className={un.en_retard ? "cadc-note cadc-note--rouge" : ""}>
                {libelle(un)}
              </strong>
              <br />
              <small>{t(`statut.${un.statut}`)}</small>
            </span>
          </li>
        ))}
      </ul>

      <MentionDemo langue={langue} />
    </div>
  );
}
