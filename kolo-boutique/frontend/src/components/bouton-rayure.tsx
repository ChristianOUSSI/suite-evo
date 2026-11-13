"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import type { Vente } from "@/lib/types";

export function BoutonRayure({ vente }: { vente: Vente }) {
  const routeur = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const assezLong = motif.trim().length >= 4;

  async function rayer() {
    if (!assezLong) {
      setIncident("Le motif demande quatre caractères au moins.");
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
          : "La rayure n'est pas passée au cahier.",
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
        Rayer
      </button>
    );
  }

  return (
    <div className="rang-pile">
      <div className="champ">
        <label htmlFor={`rayure-${vente.id}`}>Motif de la rayure</label>
        <input
          id={`rayure-${vente.id}`}
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          maxLength={160}
          placeholder="le client a repris la marchandise"
          autoFocus
        />
        <span className="champ__aide">
          La marchandise revient en réserve. La ligne reste au journal, barrée.
        </span>
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
          {enCours ? "Rayure" : "Rayer la vente"}
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
          Laisser la ligne
        </button>
      </div>
    </div>
  );
}
