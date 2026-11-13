"use client";

import Link from "next/link";

import { ErreurChantier } from "@/lib/errors";
import { traduire } from "@/lib/langue";
import { useLangueChoisie } from "@/lib/preferences";

/**
 * L'écran d'erreur des pages du boutique.
 *
 * Deux règles, apprises sur le terrain. La première : ne jamais afficher le
 * texte brut d'une erreur du framework, c'est de l'anglais machine pour une
 * trésorière. La seconde : la langue se relit dans le cookie, car un écran
 * d'erreur client n'hérite pas de la langue choisie côté serveur.
 */
export function EcranErreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const langue = useLangueChoisie();
  const t = traduire(langue).t;
  const message =
    error instanceof ErreurChantier
      ? error.message
      : langue === "en"
        ? "The page could not be read. Nothing was written."
        : "La page n'a pas pu être lue. Rien n'a été écrit.";

  return (
    <div className="cadc-gabarit--etroit cadc-pile" style={{ paddingBlock: 28 }}>
      <span className="cadc-badge cadc-badge--rouge">{t("commun.ferme")}</span>
      <h1 style={{ fontSize: "clamp(1.7rem,7vw,2.4rem)" }}>{t("commun.incident")}</h1>
      <p style={{ color: "var(--cadc-encre-2)" }}>{message}</p>
      <p className="cadc-note cadc-note--acier">{t("commun.incident-aide")}</p>
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={reset}>
          {t("commun.essayer")}
        </button>
        <Link href="/pointage" className="cadc-bouton">
          {t("nav.pointage")}
        </Link>
        <Link href="/connexion" className="cadc-bouton cadc-bouton--doux">
          {t("seance.ouvrir")}
        </Link>
      </div>
    </div>
  );
}
