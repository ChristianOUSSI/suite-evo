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
      className="lien-sortie"
      onClick={fermer}
      disabled={enCours}
    >
      {enCours ? t("sortie.rangement", langue) : t("sortie.ranger", langue)}
    </button>
  );
}
