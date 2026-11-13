"use client";

import { traduire } from "@/lib/langue";

/**
 * Imprimer le mois.
 *
 * Le papier reste la preuve qui voyage : l'ouvrier qui reçoit son salaire en
 * espèces garde souvent la feuille dans sa poche, loin de tout téléphone.
 */
export function Impression({ langue }: { langue: string }) {
  const t = traduire(langue).t;

  return (
    <button type="button" className="cadc-bouton" onClick={() => window.print()}>
      {t("bulletin.imprimer")}
    </button>
  );
}
