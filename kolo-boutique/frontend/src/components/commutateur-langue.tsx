"use client";

import { LANGUES, NOM_COOKIE, normaliserLangue, type Langue } from "@/lib/langue";

const ANCIENNETE = 60 * 60 * 24 * 365;

function choisir(langue: Langue) {
  document.cookie = `${NOM_COOKIE}=${langue}; path=/; max-age=${ANCIENNETE}; samesite=lax`;
  window.location.reload();
}

export function CommutateurLangue({ langue }: { langue: Langue }) {
  return (
    <div className="commutateur-langue" role="group" aria-label="Langue / Language">
      {LANGUES.map((code) => (
        <button
          key={code}
          type="button"
          className={code === langue ? "est-actif" : ""}
          aria-pressed={code === langue}
          onClick={() => choisir(code)}
        >
          {code === "fr" ? "FR" : "EN"}
        </button>
      ))}
    </div>
  );
}
