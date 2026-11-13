"use client";

const CHEMIN = "/api";

export class ErreurApi extends Error {}

async function envoie<T>(
  methode: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  chemin: string,
  corps?: unknown
): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(`${CHEMIN}${chemin}`, {
      method: methode,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  } catch {
    // Le navigateur n'a pas joint le tout-venant : la panne est locale, pas une
    // erreur de saisie, et ça doit se dire comme tel.
    throw new ErreurApi(
      "Le standard ne répond pas. Vérifie ta connexion et que l'API est démarrée."
    );
  }
  if (reponse.status === 204) {
    return null as T;
  }
  const data = await reponse.json().catch(() => null);
  if (!reponse.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : null;
    if (detail) throw new ErreurApi(detail);
    if (Array.isArray(data?.detail)) {
      throw new ErreurApi("Le formulaire attend un autre format.");
    }
    throw new ErreurApi("Le standard ne répond pas.");
  }
  return data as T;
}

export const poster = <T,>(chemin: string, corps: unknown) =>
  envoie<T>("POST", chemin, corps);
export const patcher = <T,>(chemin: string, corps: unknown) =>
  envoie<T>("PATCH", chemin, corps);
export const remplacer = <T,>(chemin: string, corps: unknown) =>
  envoie<T>("PUT", chemin, corps);
export const supprimer = (chemin: string) => envoie<null>("DELETE", chemin);
export const charger = <T,>(chemin: string) => envoie<T>("GET", chemin);

export function parametres(
  champs: Record<string, string | number | boolean | null | undefined>
): string {
  const URL = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(champs)) {
    if (valeur !== null && valeur !== undefined && valeur !== "") {
      URL.set(cle, String(valeur));
    }
  }
  const texte = URL.toString();
  return texte ? `?${texte}` : "";
}
