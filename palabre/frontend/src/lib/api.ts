import { cookies } from "next/headers";

import { ApiError } from "./errors";

const API_ORIGIN = process.env.PALABRE_API_URL ?? "http://127.0.0.1:8000";

function messageFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "Le serveur n'a pas répondu comme prévu.";
  }
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown };
    if (typeof first.msg === "string") {
      return first.msg;
    }
  }
  return "La demande n'a pas pu aboutir.";
}

export async function apiGet<T>(path: string): Promise<T> {
  const jar = await cookies();
  let response: Response;
  try {
    response = await fetch(`${API_ORIGIN}${path}`, {
      headers: {
        accept: "application/json",
        cookie: jar.toString(),
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Le carnet est injoignable. Vérifiez que l'API est démarrée.",
      503,
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(messageFromPayload(payload), response.status);
  }
  return payload as T;
}

export async function apiGetOptional<T>(path: string): Promise<T | null> {
  try {
    return await apiGet<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
