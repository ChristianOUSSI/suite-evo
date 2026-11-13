import { ErreurCaisse } from "./errors";

type Methode = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const CHEMIN = "/api";

function messageDans(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
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
  return "";
}

// Une réponse JSON sans `detail` : c'est le statut qui porte l'information.
function messageSelonStatut(statut: number): string {
  if (statut === 401 || statut === 403) {
    return "La séance n'est plus valide. Rouvre la caisse.";
  }
  if (statut === 404) {
    return "Le registre ne connaît pas cette page.";
  }
  if (statut === 422 || statut === 400) {
    return "La caisse n'a pas accepté cette saisie.";
  }
  if (statut === 502 || statut === 503 || statut === 504) {
    return "La caisse de l'école est injoignable. Vérifie que l'API est démarrée.";
  }
  return "La demande n'a pas pu aboutir.";
}

export async function ecrire<T>(
  path: string,
  options: { method?: Methode; body?: unknown } = {},
): Promise<T> {
  const { method = "POST", body } = options;
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
    throw new ErreurCaisse(
      "La caisse ne répond pas. Vérifiez votre connexion.",
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
    // Quand la réécriture Next ne joint pas FastAPI, la réponse est un 500 en
    // texte brut : pas de JSON, donc la seule lecture utile est que la caisse
    // n'a pas répondu, et c'est ce qu'on dit à la caissière.
    const texte = renduJson
      ? messageDans(payload) || messageSelonStatut(reponse.status)
      : "La caisse de l'école ne répond pas. Vérifie qu'elle est démarrée.";
    throw new ErreurCaisse(texte, reponse.status);
  }
  return payload as T;
}

export function parametres(
  valeurs: Record<string, string | number | null | undefined>,
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
