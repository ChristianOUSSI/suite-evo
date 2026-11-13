"use client";

import Link from "next/link";

import { Icone } from "@/components/icone";

export default function IncidentPublic({ reset }: { reset: () => void }) {
  return (
    <div className="shell incident">
      <span className="kicker">
        <Icone nom="alerte" taille={14} /> Lecture impossible
      </span>
      <h1 className="display">Cette page n&apos;a pas pu se poser.</h1>
      <p>
        Le registre de l&apos;école n&apos;a pas rendu cette feuille. Vérifie
        qu&apos;il tourne sur le port attendu, puis repasse. Si le matin même
        tout fonctionnait, note l&apos;heure et préviens le bureau de
        l&apos;agence : la page se reconstruit sans perdre d&apos;écriture.
      </p>
      <div className="form-actions">
        <button type="button" className="btn btn--ink" onClick={reset}>
          Repasser
        </button>
        <Link href="/" className="btn">
          Retour à la présentation
        </Link>
      </div>
    </div>
  );
}
