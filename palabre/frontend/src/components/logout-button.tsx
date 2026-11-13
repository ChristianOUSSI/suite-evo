"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiCall } from "@/lib/client-api";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await apiCall<void>("/auth/logout", { method: "POST" });
      router.push("/connexion");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="logout-link"
      onClick={handleLogout}
      disabled={busy}
    >
      {busy ? "Fermeture" : "Fermer"}
    </button>
  );
}
