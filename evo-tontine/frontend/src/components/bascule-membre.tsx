"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCercle } from "@/lib/errors";

type Props = {
  membreId: number;
  actif: boolean;
  langue: string;
  gestion: boolean;
};

/**
 * Sortir un membre n'efface rien.
 *
 * Le cahier d'une tontine ne se raye pas : un nom qui sort arrête la part au
 * tour suivant et laisse intactes les parts déjà écrites. Le geste est donc un
 * simple aller-retour, jamais une suppression.
 */
export function BasculeMembre({ membreId, actif, langue, gestion }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function basculer() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire(`/membres/${membreId}`, {
        method: "PATCH",
        body: { actif: !actif },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCercle ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  if (!gestion) {
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
        {enCours ? t("commun.ecriture") : actif ? t("membres.sortir") : t("membres.reprendre")}
      </button>
      <span className="cadc-champ__aide">
        {actif ? t("membres.actif") : t("membres.sortir-aide")}
      </span>
      {erreur ? (
        <span className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </span>
      ) : null}
    </div>
  );
}
