"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCercle } from "@/lib/errors";
import { formats } from "@/lib/format";
import type { Membre, Paiement } from "@/lib/types";

type Rail = { code: string; ouvert: boolean };

type Props = {
  tourId: number;
  membre: Pick<Membre, "id" | "nom" | "du" | "reste">;
  rails: Rail[];
  langue: string;
  gestion: boolean;
};

/**
 * La part qui rentre.
 *
 * Le montant proposé est le reste dû : à la caisse, on ne ressaisit pas un
 * chiffre que l'écran connaît déjà. Le rail, lui, se choisit, et la date
 * aussi : un paiement remis à hier écrit une pénalité, à aujourd'hui n'en
 * écrit aucune.
 */
export function Encaissement({ tourId, membre, rails, langue, gestion }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const portes = rails.filter((un) => un.ouvert);
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState(portes[0]?.code ?? "especes");
  const [montant, setMontant] = useState(String(membre.reste));
  const [jour, setJour] = useState(formats(langue).aujourdhui());
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const f = formats(langue);

  async function encaisser() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Paiement>(`/tours/${tourId}/cotiser`, {
        body: {
          membre_id: membre.id,
          montant: montant === "" ? null : Number(montant),
          mode,
          jour,
        },
        langue,
      });
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCercle ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  if (!gestion) {
    return null;
  }

  if (membre.reste <= 0) {
    return (
      <p className="cadc-note cadc-note--vert">
        {t("membres.payerTous")} · {f.fcfa(membre.du)}
      </p>
    );
  }

  if (!ouvert) {
    return (
      <>
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={() => setOuvert(true)}
        >
          {t("membres.payer")}
        </button>
        <p className="cadc-champ__aide">
          {t("cercle.restant")} {f.fcfa(membre.reste)}
        </p>
      </>
    );
  }

  return (
    <div className="cadc-pile cadc-pile--serree">
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("cercle.restant")}</span>
        <input
          type="number"
          inputMode="numeric"
          step={100}
          min={0}
          max={membre.reste}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
        />
        <span className="cadc-champ__aide">{t("reglages.montant-aide")}</span>
      </label>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("reglages.rails")}</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {portes.map((un) => (
            <option key={un.code} value={un.code}>
              {t(`rail.${un.code}`)}
            </option>
          ))}
        </select>
        {portes.length === 0 ? (
          <span className="cadc-champ__aide">{t("reglages.aideRails")}</span>
        ) : null}
      </label>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("commun.date")}</span>
        <input type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
      </label>

      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={encaisser}
          disabled={enCours || portes.length === 0}
        >
          {enCours ? t("commun.ecriture") : t("membres.payer")}
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
