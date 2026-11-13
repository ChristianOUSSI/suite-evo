import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { NOM_COOKIE, normaliserLangue } from "@cadc/kit/i18n";

import { lire } from "./api";
import { ErreurChantier } from "./errors";
import type { Seance } from "./types";

/** La langue choisie, lue là où le serveur la voit : dans le cookie. */
export const langueCourante = cache(async (): Promise<"fr" | "en"> => {
  const bocal = await cookies();
  return normaliserLangue(bocal.get(NOM_COOKIE)?.value);
});

export const seance = cache(async (): Promise<Seance | null> => {
  const langue = await langueCourante();
  try {
    return await lire<Seance>("/auth/me", langue);
  } catch (erreur) {
    if (erreur instanceof ErreurChantier && erreur.status === 401) {
      return null;
    }
    throw erreur;
  }
});

export async function seanceObligatoire(): Promise<Seance> {
  const courante = await seance();
  if (!courante) {
    redirect("/connexion");
  }
  return courante;
}
