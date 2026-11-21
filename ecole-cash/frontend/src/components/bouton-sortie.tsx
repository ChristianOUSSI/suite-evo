"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ecrire } from "@/lib/client-api";
import { t, type Langue } from "@/lib/langue";

export function BoutonSortie({ langue = "fr" }: { langue?: Langue }) {
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
      className="logout-link"
      onClick={fermer}
      disabled={enCours}
    >
      {enCours ? t("sortie.fermeture", langue) : t("sortie.fermer", langue)}
    </button>
  );
}
