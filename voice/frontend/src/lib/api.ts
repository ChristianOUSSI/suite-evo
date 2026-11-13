import { cookies } from "next/headers";

const ORIGIN = process.env.VOICE_API_URL ?? "http://127.0.0.1:8100";
const NOM_COOKIE = "voice_session";

export class NonLie extends Error {}

// L'API du standard n'a pas répondu du tout : réseau coupé, service arrêté,
// port qui n'écoute rien. Distinct d'une erreur de séance.
export class StandardEteint extends Error {}

async function demande<T>(
  chemin: string,
  methode: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  corps?: unknown
): Promise<T> {
  const boutique = await cookies();
  const session = boutique.get(NOM_COOKIE)?.value;
  let reponse: Response;
  try {
    reponse = await fetch(`${ORIGIN}${chemin}`, {
      method: methode,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Cookie: `${NOM_COOKIE}=${session}` } : {}),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  } catch {
    throw new StandardEteint(
      "Le standard ne répond pas. Vérifie que l'API est démarrée."
    );
  }
  if (reponse.status === 401) {
    throw new NonLie("session expirée");
  }
  if (!reponse.ok) {
    const detail = await reponse.json().catch(() => null);
    throw new Error(
      typeof detail?.detail === "string"
        ? detail.detail
        : "Le registre du standard n'a pas rendu cette page."
    );
  }
  if (reponse.status === 204) {
    return null as T;
  }
  return reponse.json() as Promise<T>;
}

export const lire = <T,>(chemin: string) => demande<T>(chemin, "GET");
export const ecrire = <T,>(chemin: string, corps: unknown) =>
  demande<T>(chemin, "POST", corps);
export const corriger = <T,>(chemin: string, corps: unknown) =>
  demande<T>(chemin, "PATCH", corps);

export function sessionPresente() {
  return cookies().then((boutique) => Boolean(boutique.get(NOM_COOKIE)?.value));
}
