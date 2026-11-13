import { cache } from "react";
import { redirect } from "next/navigation";

import { lire } from "./api";
import { ErreurCaisse } from "./errors";
import type { Seance } from "./types";

export const seance = cache(async (): Promise<Seance | null> => {
  try {
    return await lire<Seance>("/auth/me");
  } catch (erreur) {
    if (erreur instanceof ErreurCaisse && erreur.status === 401) {
      return null;
    }
    throw erreur;
  }
});

export async function seanceObligatoire(): Promise<Seance> {
  const courant = await seance();
  if (!courant) {
    redirect("/connexion");
  }
  return courant;
}
