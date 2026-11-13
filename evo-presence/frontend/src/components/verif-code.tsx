"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";

/** Le code public : dix signes, sans O, sans I, sans 0, sans 1. */
const FORME = /^[A-HJ-NP-Z2-9]{10}$/;

type Props = {
  langue: string;
  initial?: string;
};

export function VerifCode({ langue, initial = "" }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [code, setCode] = useState(initial);
  const [tordu, setTordu] = useState(false);

  function envoyer() {
    const propre = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!FORME.test(propre)) {
      setTordu(true);
      return;
    }
    routeur.push(`/verifier/${propre}`);
  }

  return (
    <div className="cadc-pile">
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("bulletin.code")}</span>
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 14));
            setTordu(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              envoyer();
            }
          }}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={tordu ? "true" : undefined}
          placeholder="7KQM4X2R8P"
          className="bulletin__saisie"
        />
        <span className="cadc-champ__aide">{t("bulletin.code-aide")}</span>
      </label>

      {tordu ? (
        <p className="cadc-note cadc-note--rouge" role="status">
          {t("bulletin.forme")}
        </p>
      ) : null}

      <button
        type="button"
        className="cadc-bouton cadc-bouton--premier cadc-bouton--grand"
        onClick={envoyer}
        disabled={code.trim().length < 10}
      >
        {t("bulletin.demander")}
      </button>
    </div>
  );
}
