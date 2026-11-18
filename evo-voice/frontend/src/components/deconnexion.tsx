"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurVoix } from "@/lib/errors";

/**
 * Ranger le cahier.
 *
 * Le cookie de séance meurt avec la demande : le téléphone d'une trésorière
 * qui prête son appareil à sa voisine ne laisse rien d'ouvert derrière elle.
 */
export function Deconnexion({ langue }: { langue: string }) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function sortir() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire("/auth/logout", { langue });
      routeur.push("/connexion");
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurVoix ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-acts">
      <button
        type="button"
        className="cadc-bouton cadc-bouton--danger"
        onClick={sortir}
        disabled={enCours}
      >
        {enCours ? t("commun.ecriture") : t("commun.sortir")}
      </button>
      {erreur ? (
        <span className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </span>
      ) : null}
    </div>
  );
}
