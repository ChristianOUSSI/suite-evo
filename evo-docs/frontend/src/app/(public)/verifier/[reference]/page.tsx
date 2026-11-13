import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { DocumentPublic, MaisonPublique } from "@/lib/types";

import "../../../../styles/docs.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Document check" : "Vérification du document" };
}

export default async function PageVerifierReference({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { reference } = await params;

  let document: DocumentPublic | null = null;
  let maison: MaisonPublique["maison"] = null;
  try {
    const corps = await lirePublique<{ document: DocumentPublic }>(
      `/public/verifier/${encodeURIComponent(reference)}`,
      langue,
    );
    document = corps.document;
  } catch {
    document = null;
  }
  try {
    const corps = await lirePublique<MaisonPublique>("/public/maison", langue);
    maison = corps.maison;
  } catch {
    maison = null;
  }

  if (!document) {
    notFound();
  }

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={maison?.nom ?? document.maison} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit classeur">
          <div className="classeur__tete">
            <span className="cadc-badge cadc-badge--acier">{document.reference}</span>
            <h1>{t("verifier.trouve")}</h1>
            <p>
              {t(`categorie.${document.categorie}`)} · {t(`statut.${document.statut}`)}
            </p>
          </div>

          <section className="cadc-carte">
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("documents.titre_champ")}</span>
                <span className="cadc-ligne__valeur">{document.titre}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("verifier.date")}</span>
                <span className="cadc-ligne__valeur">{f.jourDate(document.date_document)}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("verifier.maison")}</span>
                <span className="cadc-ligne__valeur">
                  {document.maison} · {document.ville}
                </span>
              </li>
            </ul>
          </section>

          <div className="cadc-acts">
            {maison?.telephone ? (
              <a className="cadc-bouton cadc-bouton--premier" href={`tel:${maison.telephone}`}>
                {t("verifier.appeler")}
              </a>
            ) : null}
            <Link href="/verifier" className="cadc-bouton cadc-bouton--doux">
              {t("verifier.chercher")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
