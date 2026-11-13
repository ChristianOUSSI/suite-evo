"use client";

import Link from "next/link";

import { Icone } from "@/components/icone";

export default function Incident({ reset }: { reset: () => void }) {
  return (
    <div className="shell incident">
      <span className="kicker">
        <Icone nom="alerte" taille={14} /> Lecture impossible
      </span>
      <h1 className="display">La caisse ne rend pas la page.</h1>
      <p>
        Rien n&apos;est perdu : les écritures déjà consignées tiennent dans le
        registre. Vérifie que l&apos;API tourne sur le port attendu puis
        repasse ; si la page repart en erreur, note l&apos;heure et préviens le
        bureau de l&apos;agence.
      </p>
      <div className="form-actions">
        <button type="button" className="btn btn--ink" onClick={reset}>
          Repasser
        </button>
        <Link href="/app" className="btn">
          Tableau de la journée
        </Link>
      </div>
    </div>
  );
}
