"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";
import { formats } from "@/lib/format";
import type { Relance } from "@/lib/types";

type Props = {
  clientId: number;
  langue: string;
  motif?: string;
};

/**
 * Poser une reprise.
 *
 * Le motif est obligatoire : une relance sans raison reste dans la liste
 * trois semaines et n'apprend rien à celui qui la lit.
 */
export function RelanceForm({ clientId, langue, motif = "" }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState(motif);
  const [due, setDue] = useState(f.aujourdhui());
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function poser() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Relance>(`/clients/${clientId}/relances`, {
        body: { motif: raison, due_le: due || null },
        langue,
      });
      setRaison("");
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button type="button" className="cadc-bouton" onClick={() => setOuvert(true)}>
        {t("relance.programmer")}
      </button>
    );
  }

  return (
    <div className="cadc-pile cadc-pile--serree">
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("relance.motif")}</span>
        <input
          value={raison}
          onChange={(e) => setRaison(e.target.value)}
          maxLength={240}
          placeholder={
            langue === "en"
              ? "Bring the palette price"
              : "Apporter le prix de la palette"
          }
        />
        <span className="cadc-champ__aide">{t("relance.motif-aide")}</span>
      </label>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("relance.due")}</span>
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>

      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={poser}
          disabled={enCours || raison.trim().length < 3}
        >
          {enCours ? t("commun.ecriture") : t("relance.programmer")}
        </button>
        <button type="button" className="cadc-bouton" onClick={() => setOuvert(false)}>
          {t("commun.annuler")}
        </button>
      </div>

      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
