import { cookies } from "next/headers";

import { ErreurCaisse } from "./errors";

const API_ORIGIN = process.env.CASH_API_URL ?? "http://127.0.0.1:8200";

const NOM_COOKIE = "cash_session";

function messageDans(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "La caisse n'a pas répondu comme prévu.";
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const premier = detail[0] as { msg?: unknown; loc?: unknown };
    if (typeof premier.msg === "string") {
      const champ = Array.isArray(premier.loc)
        ? premier.loc[premier.loc.length - 1]
        : null;
      return champ ? `${String(champ)} : ${premier.msg}` : premier.msg;
    }
  }
  return "La demande n'a pas pu aboutir.";
}

export async function lire<T>(path: string): Promise<T> {
  const jar = await cookies();
  const session = jar.get(NOM_COOKIE)?.value;
  let reponse: Response;
  try {
    reponse = await fetch(`${API_ORIGIN}${path}`, {
      headers: {
        accept: "application/json",
        ...(session ? { cookie: `${NOM_COOKIE}=${session}` } : {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new ErreurCaisse(
      "La caisse de l'école est injoignable. Vérifiez que l'API est démarrée.",
      503,
    );
  }

  let payload: unknown = null;
  if (reponse.status !== 204) {
    try {
      payload = await reponse.json();
    } catch {
      payload = null;
    }
  }

  if (!reponse.ok) {
    throw new ErreurCaisse(messageDans(payload), reponse.status);
  }
  return payload as T;
}

export async function lireOuRien<T>(path: string): Promise<T | null> {
  try {
    return await lire<T>(path);
  } catch (erreur) {
    if (erreur instanceof ErreurCaisse && erreur.status === 404) {
      return null;
    }
    throw erreur;
  }
}
