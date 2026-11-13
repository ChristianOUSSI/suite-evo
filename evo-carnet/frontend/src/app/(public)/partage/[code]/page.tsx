import type { Metadata } from "next";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { NotePartagee } from "@/lib/types";

import "../../../../styles/carnet.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "A shared note" : "Une note partagée" };
}

export default async function PagePartage({ params }: { params: Promise<{ code: string }> }) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { code } = await params;

  let partage: NotePartagee | null = null;
  try {
    partage = await lirePublique<NotePartagee>(`/public/notes/${encodeURIComponent(code)}`, langue);
  } catch {
    partage = null;
  }

  const note = partage?.note ?? null;
  const carnet = partage?.carnet ?? null;

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" sous={carnet?.nom ?? "evo-carnet"} />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit standard">
          <div className="standard__tete">
            <span className="cadc-badge cadc-badge--acier">{carnet?.nom ?? "evo-carnet"}</span>
            <h1>{note?.titre ?? t("partage.titre")}</h1>
            <p>{t("partage.chapo")}</p>
          </div>

          {!note ? (
            <p className="cadc-note">{t("partage.perdu")}</p>
          ) : (
            <article className="cadc-carte cadc-pile">
              <div className="cadc-tete">
                <h2>{note.titre}</h2>
                <span className="cadc-tete__cote">
                  {t(`categorie.${note.categorie}`)}
                  {note.maj_le ? ` · ${t("partage.maj")} ${f.jourDate(note.maj_le)}` : ""}
                </span>
              </div>
              <p style={{ whiteSpace: "pre-wrap" }}>{note.contenu}</p>
              <p className="cadc-note">
                {t("partage.retour")} {carnet?.nom ?? ""}
                {carnet?.telephone ? (
                  <>
                    {" · "}
                    <a href={`tel:${carnet.telephone.replace(/\D/g, "")}`}>{carnet.telephone_display}</a>
                  </>
                ) : null}
              </p>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
