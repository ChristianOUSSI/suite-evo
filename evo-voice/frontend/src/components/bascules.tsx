"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ETIQUETTES_LANGUE, LANGUES } from "@cadc/kit/i18n";

import { changerTailleTexte, useTailleTexte } from "@/lib/preferences";
import { traduire } from "@/lib/langue";

const TAILLES = [
  { cle: "normal", label: "A", taille: "0.95rem" },
  { cle: "grand", label: "A", taille: "1.1rem" },
  { cle: "tres-grand", label: "A", taille: "1.3rem" },
];

/**
 * Deux réglages d'accessibilité qui se choisissent en un geste et se
 * retiennent : la langue, et la taille du texte. La langue part dans un cookie
 * lu par le serveur, la taille dans le téléphone pour ne pas attendre un
 * aller-retour sur une connexion de quartier.
 */
export function Bascules({ langue }: { langue: string }) {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);
  const taille = useTailleTexte();
  const t = traduire(langue).t;

  async function choisirLangue(code: string) {
    if (code === langue) return;
    setEnCours(true);
    try {
      await fetch(`/langue?code=${code}`, { method: "POST" });
      routeur.refresh();
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div className="cadc-texte-taille" role="group" aria-label={t("texte.label")}>
        {TAILLES.map((un) => (
          <button
            type="button"
            key={un.cle}
            style={{ fontSize: un.taille }}
            aria-pressed={taille === un.cle}
            onClick={() => changerTailleTexte(un.cle)}
          >
            {un.label}
          </button>
        ))}
      </div>

      <div className="cadc-langues" role="group" aria-label={t("langue.label")}>
        {LANGUES.map((code) => (
          <button
            key={code}
            type="button"
            className="cadc-langue"
            aria-pressed={code === langue}
            disabled={enCours}
            onClick={() => choisirLangue(code)}
          >
            {ETIQUETTES_LANGUE[code].court}
          </button>
        ))}
      </div>
    </div>
  );
}
