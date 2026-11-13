import { cookies } from "next/headers";

import { ErreurChantier } from "./errors";

const API_ORIGIN = process.env.EVO_IMMO_API_URL ?? "http://127.0.0.1:9300";
const NOM_COOKIE = "evo_immo_session";

/**
 * Le backend rend ses refus en `{ code, fr, en }`. On choisit la langue ici,
 * à la sortie du serveur : l'écran n'a jamais à deviner une langue.
 */
export function texteDans(detail: unknown, langue: string): string {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  const corps = detail as { fr?: unknown; en?: unknown };
  const cle = langue === "en" ? "en" : "fr";
  const choix = corps[cle] ?? corps.fr ?? corps.en;
  return typeof choix === "string" ? choix : "";
}

export async function lire<T>(path: string, langue = "fr"): Promise<T> {
  const bocal = await cookies();
  const seance = bocal.get(NOM_COOKIE)?.value;
  let reponse: Response;
  try {
    reponse = await fetch(`${API_ORIGIN}${path}`, {
      headers: {
        accept: "application/json",
        ...(seance ? { cookie: `${NOM_COOKIE}=${seance}` } : {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ErreurChantier(
      langue === "en"
        ? "The register is not answering. Check that the API is running."
        : "L'agence ne répond pas. Vérifie que l'API est démarrée.",
      503,
    );
  }

  let payload: unknown = null;
  try {
    payload = await reponse.json();
  } catch {
    payload = null;
  }

  if (!reponse.ok) {
    throw new ErreurChantier(
      texteDans((payload as { detail?: unknown })?.detail, langue) ||
        (langue === "en"
          ? "This page could not be read."
          : "Cette page n'a pas pu être lue."),
      reponse.status,
    );
  }
  return payload as T;
}

export async function lireOuRien<T>(path: string, langue = "fr"): Promise<T | null> {
  try {
    return await lire<T>(path, langue);
  } catch (erreur) {
    if (erreur instanceof ErreurChantier && erreur.status === 404) {
      return null;
    }
    throw erreur;
  }
}

export async function lirePublique<T>(path: string, langue = "fr"): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${API_ORIGIN}${path}`, {
      headers: { "accept-language": langue },
      cache: "no-store",
    });
  } catch {
    throw new ErreurChantier(
      langue === "en"
        ? "The clinic is not answering. Check that the API is running."
        : "L'agence ne répond pas. Vérifie que l'API est démarrée.",
      0,
    );
  }
  let payload: unknown = null;
  try {
    payload = await reponse.json();
  } catch {
    payload = null;
  }
  if (!reponse.ok) {
    throw new ErreurChantier(
      texteDans((payload as { detail?: unknown })?.detail, langue) ||
        (langue === "en" ? "This page could not be read." : "Cette page n'a pas pu être lue."),
      reponse.status,
    );
  }
  return payload as T;
}
