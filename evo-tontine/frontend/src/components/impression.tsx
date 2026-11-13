"use client";

import { traduire } from "@/lib/langue";

/**
 * Imprimer le reçu.
 *
 * Le papier reste la preuve qui voyage : le membre qui reçoit le pot donne
 * souvent la feuille à celui qui a cotisé sans téléphone.
 */
export function Impression({ langue }: { langue: string }) {
  const t = traduire(langue).t;

  return (
    <button type="button" className="cadc-bouton" onClick={() => window.print()}>
      {t("verif.imprimer")}
    </button>
  );
}
