import type { Metadata } from "next";

import { MentionDemo } from "@/components/mention-demo";
import { NotesGerant } from "@/components/notes-gerant";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListeNotes } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Notes" : "Les notes" };
}

export default async function PageNotes() {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;

  const [corps, archivees] = await Promise.all([
    lire<ListeNotes>("/notes", langue),
    lire<ListeNotes>("/notes?archivees=true", langue),
  ]);

  return (
    <div className="cadc-gabarit standard">
      <div className="standard__tete">
        <span className="cadc-badge cadc-badge--acier">{corps.total} {t("accueil.notes")}</span>
        <h1>{t("notes.titre")}</h1>
        <p>{t("notes.chapo")}</p>
      </div>

      <NotesGerant notes={corps.notes} archivees={archivees.notes} langue={langue} />
      <MentionDemo langue={langue} />
    </div>
  );
}
