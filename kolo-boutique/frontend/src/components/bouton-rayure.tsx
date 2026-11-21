"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Vente } from "@/lib/types";

export function BoutonRayure({
  vente,
  langue = LANGUE_DEFAUT,
}: {
  vente: Vente;
  langue?: Langue;
}) {
  const routeur = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const assezLong = motif.trim().length >= 4;

  async function rayer() {
    if (!assezLong) {
      setIncident(t("rayure.incident-motif", langue));
      return;
    }
    setEnCours(true);
    setIncident(null);
    try {
      await ecrire(`/ventes/${vente.id}/annuler`, {
        method: "POST",
        body: { motif: motif.trim() },
      });
      setOuvert(false);
      setMotif("");
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : t("rayure.incident", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        className="bouton bouton--petit bouton--doux"
        onClick={() => setOuvert(true)}
      >
        {t("rayure.bouton", langue)}
      </button>
    );
  }

  return (
    <div className="rang-pile">
      <div className="champ">
        <label htmlFor={`rayure-${vente.id}`}>{t("rayure.label", langue)}</label>
        <input
          id={`rayure-${vente.id}`}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={160}
          placeholder={t("rayure.ph", langue)}
          autoFocus
        />
        <span className="champ__aide">{t("rayure.aide", langue)}</span>
      </div>
      {incident ? (
        <p className="note-bas note-bas--tard" role="alert">
          {incident}
        </p>
      ) : null}
      <div className="acts">
        <button
          type="button"
          className="bouton bouton--petit bouton--encre"
          onClick={rayer}
          disabled={enCours || !assezLong}
        >
          {enCours ? t("rayure.encours", langue) : t("rayure.confirmer", langue)}
          <span className="bouton__fleche">
            <Icone nom="croix" taille={14} />
          </span>
        </button>
        <button
          type="button"
          className="bouton bouton--petit bouton--doux"
          onClick={() => {
            setOuvert(false);
            setIncident(null);
          }}
        >
          {t("rayure.garder", langue)}
        </button>
      </div>
    </div>
  );
}
