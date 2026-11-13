import { redirect } from "next/navigation";
import { NonLie, lire } from "@/lib/api";
import type { Session } from "@/lib/types";

export async function seance(): Promise<Session> {
  try {
    return await lire<Session>("/auth/me");
  } catch (erreur) {
    if (erreur instanceof NonLie) redirect("/connexion");
    throw erreur;
  }
}
