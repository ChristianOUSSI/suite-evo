"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ecrire } from "@/lib/client-api";

export function BoutonSortie() {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function fermer() {
    setEnCours(true);
    try {
      await ecrire<void>("/auth/logout", { method: "POST" });
      routeur.push("/connexion");
      routeur.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      className="lien-sortie"
      onClick={fermer}
      disabled={enCours}
    >
      {enCours ? "Rangement" : "Ranger"}
    </button>
  );
}
