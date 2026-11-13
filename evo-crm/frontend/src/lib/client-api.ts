import { ErreurCarnet } from "./errors";

type Methode = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const CHEMIN = "/api";

/**
 * Le navigateur ne connaît pas la langue du serveur : on la lui passe à
 * chaque appel, et le refus revient déjà dans sa langue.
 */
function choisir(detail: unknown, langue: string): string {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  const corps = detail as { fr?: unknown; en?: unknown };
  const cle = langue === "en" ? "en" : "fr";
  const choix = corps[cle] ?? corps.fr ?? corps.en;
  return typeof choix === "string" ? choix : "";
}

export async function ecrire<T>(
  path: string,
  options: { method?: Methode; body?: unknown; langue?: string } = {},
): Promise<T> {
  const { method = "POST", body, langue = "fr" } = options;
  let reponse: Response;
  try {
    reponse = await fetch(`${CHEMIN}${path}`, {
      method,
      headers:
        body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ErreurCarnet(
      langue === "en"
        ? "The book is not answering. Check your connection and that the API is running."
        : "Le carnet ne répond pas. Vérifie ta connexion et que l'API est démarrée.",
      503,
    );
  }

  let payload: unknown = null;
  let renduJson = false;
  if (reponse.status !== 204) {
    try {
      payload = await reponse.json();
      renduJson = true;
    } catch {
      payload = null;
    }
  }

  if (!reponse.ok) {
    const detail = (payload as { detail?: unknown })?.detail;
    const texte = renduJson ? choisir(detail, langue) : "";
    throw new ErreurCarnet(
      texte ||
        (reponse.status === 500 || reponse.status === 502 ||
        reponse.status === 503 || reponse.status === 504
          ? langue === "en"
            ? "The book is not answering. Check that the API is running."
            : "Le carnet ne répond pas. Vérifie que l'API est démarrée."
          : langue === "en"
            ? "The book did not accept this."
            : "Le cahier n'a pas accepté cette écriture."),
      reponse.status,
    );
  }
  return payload as T;
}

export function parametres(
  valeurs: Record<string, string | number | boolean | null | undefined>,
): string {
  const recherche = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur !== null && valeur !== undefined && `${valeur}` !== "") {
      recherche.set(cle, `${valeur}`);
    }
  }
  const rendu = recherche.toString();
  return rendu ? `?${rendu}` : "";
}
