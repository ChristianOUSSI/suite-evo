import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { FilePublique } from "@/lib/types";

import "../../../styles/calls.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "The queue" : "La file" };
}

export default async function PageFile() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  let file: FilePublique | null = null;
  try {
    file = await lirePublique<FilePublique>("/public/file", langue);
  } catch {
    file = null;
  }

  const centre = file?.centre ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={centre?.nom ?? "evo-call"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{centre?.nom ?? "evo-call"}</span>
            <h1>{t("file.titre")}</h1>
            <p>{t("file.chapo")}</p>
          </div>

          {file ? (
            <div className="portails">
              <div className="souche">
                <span className="souche__legende">{t("file.attendent")}</span>
                <span className="souche__valeur">{file.en_file}</span>
                <span className="souche__aide">{centre?.telephone_display ?? ""}</span>
              </div>
              <div className="souche">
                <span className="souche__legende">{t("file.en_cours")}</span>
                <span className="souche__valeur">{file.en_cours}</span>
                <span className="souche__aide">{centre?.ville ?? ""}</span>
              </div>
            </div>
          ) : (
            <p className="cadc-note">{t("commun.horsLigne")}</p>
          )}

          <p className="cadc-note cadc-note--acier">{t("file.aide")}</p>
        </div>
      </main>
    </div>
  );
}
