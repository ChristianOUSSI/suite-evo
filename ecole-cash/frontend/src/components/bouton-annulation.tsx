"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { fcfa } from "@/lib/format";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Annulation, Paiement } from "@/lib/types";

export function BoutonAnnulation({
  paiement,
  langue = LANGUE_DEFAUT,
}: {
  paiement: Paiement;
  langue?: Langue;
}) {
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
        t("annul.fait", langue, {
          montant: paiement.montant_label,
          reste: fcfa(rendu.reste),
        }),
      );
      setOuvert(false);
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : t("annul.refusee", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  if (paiement.annule) {
    return (
      <span className="tag tag--quiet">
        {t("annul.etiquette", langue, { motif: paiement.motif_annulation })}
      </span>
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
          {t("annul.bouton", langue)}
        </button>
      ) : (
        <span className="annulation__boite">
          <label className="field__label" htmlFor={`motif-${paiement.id}`}>
            {t("annul.motif", langue)}
          </label>
          <span className="annulation__rang">
            <input
              id={`motif-${paiement.id}`}
              className="input"
              type="text"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={t("annul.placeholder", langue)}
              maxLength={160}
            />
            <button
              type="button"
              className="btn btn--small btn--stamp"
              onClick={annuler}
              disabled={enCours || motif.trim().length < 4}
            >
              {enCours ? "…" : t("annul.bouton", langue)}
            </button>
            <button
              type="button"
              className="btn btn--small btn--quiet"
              onClick={() => setOuvert(false)}
            >
              {t("annul.non", langue)}
            </button>
          </span>
        </span>
      )}
      {message ? <span className="annulation__note">{message}</span> : null}
    </span>
  );
}
