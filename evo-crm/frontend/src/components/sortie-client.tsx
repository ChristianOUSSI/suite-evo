"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";

type Props = {
  clientId: number;
  actif: boolean;
  langue: string;
  responsable: boolean;
};

/**
 * Sortir une fiche du carnet, jamais l'effacer.
 *
 * Le journal d'un client qui est parti raconte encore pourquoi il est parti.
 * Le geste arrête les reprises et laisse toutes les lignes en place.
 */
export function SortieClient({ clientId, actif, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire(`/clients/${clientId}`, {
        method: "PATCH",
        body: { actif: !actif },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  if (!responsable) {
    return null;
  }

  return (
    <div className="cadc-acts">
      <button
        type="button"
        className={`cadc-bouton cadc-bouton--petit${actif ? " cadc-bouton--doux" : ""}`}
        onClick={basculer}
        disabled={enCours}
      >
        {enCours ? t("commun.ecriture") : actif ? t("clients.sortir") : t("clients.reprendre")}
      </button>
      <span className="cadc-champ__aide">
        {actif ? t("clients.dans") : t("clients.sortir-aide")}
      </span>
      {erreur ? (
        <span className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </span>
      ) : null}
    </div>
  );
}
