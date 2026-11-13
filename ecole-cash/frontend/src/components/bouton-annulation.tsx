"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { fcfa } from "@/lib/format";
import type { Annulation, Paiement } from "@/lib/types";

export function BoutonAnnulation({ paiement }: { paiement: Paiement }) {
  const routeur = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function annuler() {
    setEnCours(true);
    setMessage(null);
    try {
      const rendu = await ecrire<Annulation>(
        `/paiements/${paiement.id}/annuler`,
        { method: "POST", body: { motif: motif.trim() } },
      );
      setMessage(
        `${paiement.montant_label} retirés de la caisse · reste dû ${fcfa(rendu.reste)}.`,
      );
      setOuvert(false);
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : "Annulation refusée.",
      );
    } finally {
      setEnCours(false);
    }
  }

  if (paiement.annule) {
    return (
      <span className="tag tag--quiet">annulé : {paiement.motif_annulation}</span>
    );
  }

  return (
    <span className="annulation">
      {!ouvert ? (
        <button
          type="button"
          className="btn btn--small btn--quiet"
          onClick={() => setOuvert(true)}
        >
          Annuler
        </button>
      ) : (
        <span className="annulation__boite">
          <label className="field__label" htmlFor={`motif-${paiement.id}`}>
            Motif, quatre caractères au moins
          </label>
          <span className="annulation__rang">
            <input
              id={`motif-${paiement.id}`}
              className="input"
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="billet faux, rendu au parent…"
              maxLength={160}
            />
            <button
              type="button"
              className="btn btn--small btn--stamp"
              onClick={annuler}
              disabled={enCours || motif.trim().length < 4}
            >
              {enCours ? "…" : "Annuler"}
            </button>
            <button
              type="button"
              className="btn btn--small btn--quiet"
              onClick={() => setOuvert(false)}
            >
              Non
            </button>
          </span>
        </span>
      )}
      {message ? <span className="annulation__note">{message}</span> : null}
    </span>
  );
}
