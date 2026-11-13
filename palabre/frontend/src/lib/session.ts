import { cache } from "react";
import { redirect } from "next/navigation";

import { apiGet } from "./api";
import { ApiError } from "./errors";
import type { Session } from "./types";

export const getSession = cache(async (): Promise<Session | null> => {
  try {
    return await apiGet<Session>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/connexion");
  }
  return session;
}
