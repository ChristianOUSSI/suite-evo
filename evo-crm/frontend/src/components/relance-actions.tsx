"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";
import { formats } from "@/lib/format";
import type { Relance } from "@/lib/types";

type Props = {
  relanceId: number;
  langue: string;
};

/**
 * Clore une relance, ou la reposer plus loin.
 *
 * Les deux gestes se ressemblent au téléphone et n'ont rien de pareil dans le
 * cahier : l'un ferme une ligne, l'autre la déplace. Ils restent séparés.
 */
export function RelanceActions({ relanceId, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState("");
  const [reprise, setReprise] = useState(false);
  const [nouvelle, setNouvelle] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);

  async function clos() {
    setEnCours("fait");
    setErreur(null);
    try {
      await ecrire<Relance>(`/relances/${relanceId}/terminer`, { langue });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours("");
    }
  }

  async function deplacer() {
    if (!nouvelle) return;
    setEnCours("deplace");
    setErreur(null);
    try {
      await ecrire<Relance>(`/relances/${relanceId}`, {
        method: "PUT",
        body: { due_le: nouvelle },
        langue,
      });
      setReprise(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours("");
    }
  }

  return (
    <div className="cadc-pile cadc-pile--serree">
      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier cadc-bouton--petit"
          onClick={clos}
          disabled={enCours !== ""}
        >
          {enCours === "fait" ? t("commun.ecriture") : t("relance.terminer")}
        </button>

        {reprise ? (
          <>
            <input
              type="date"
              value={nouvelle}
              onChange={(e) => setNouvelle(e.target.value)}
              min={formats(langue).aujourdhui()}
              aria-label={t("relance.due")}
              className="cadc-saisie"
              style={{ maxWidth: 200 }}
            />
            <button
              type="button"
              className="cadc-bouton cadc-bouton--petit"
              onClick={deplacer}
              disabled={enCours !== "" || !nouvelle}
            >
              {enCours === "deplace" ? t("commun.ecriture") : t("relance.reprogrammer")}
            </button>
            <button
              type="button"
              className="cadc-bouton cadc-bouton--doux cadc-bouton--petit"
              onClick={() => setReprise(false)}
            >
              {t("commun.annuler")}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="cadc-bouton cadc-bouton--doux cadc-bouton--petit"
            onClick={() => setReprise(true)}
          >
            {t("relance.reprogrammer")}
          </button>
        )}
      </div>

      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
