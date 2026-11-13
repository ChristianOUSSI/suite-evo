import { ApiError } from "./errors";

type CallOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

function messageFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown; loc?: unknown };
    if (typeof first.msg === "string") {
      const field = Array.isArray(first.loc)
        ? first.loc[first.loc.length - 1]
        : null;
      return field
        ? `${String(field)} : ${first.msg}`
        : first.msg;
    }
  }
  return "";
}

// Quand la réécriture Next ne joint pas l'API, la réponse est un 500 en texte
// brut : pas de JSON, donc la seule lecture utile est que le carnet ne répond
// pas. Répéter « la demande n'a pas pu aboutir » ne dirait rien au commerçant.
function messageSansPayload(statut: number): string {
  if (statut === 401 || statut === 403) {
    return "La séance n'est plus valide. Rouvrez le carnet.";
  }
  if (statut === 404) {
    return "Le carnet ne connaît pas cette écriture.";
  }
  if (statut === 422 || statut === 400) {
    return "Le carnet n'a pas accepté cette saisie.";
  }
  return "Le carnet est injoignable. Vérifiez que l'API est démarrée.";
}

export async function apiCall<T>(
  path: string,
  options: CallOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      "Le carnet ne répond pas. Vérifiez votre connexion.",
      503,
    );
  }

  let payload: unknown = null;
  let renduJson = false;
  if (response.status !== 204) {
    try {
      payload = await response.json();
      renduJson = true;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      renduJson
        ? messageFromPayload(payload) || messageSansPayload(response.status)
        : messageSansPayload(response.status),
      response.status,
    );
  }
  return payload as T;
}
