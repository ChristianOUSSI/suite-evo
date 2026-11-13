"use client";

import { useRef, useState, useSyncExternalStore } from "react";

function subscribeToOrigin() {
  return () => {};
}

export function CopyPublicLink({
  token,
  reference,
}: {
  token: string;
  reference: string;
}) {
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => "",
  );
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const url = `${origin}/payer/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      inputRef.current?.select();
      document.execCommand("copy");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <section className="share-card">
      <div className="share-card__head">
        <span className="kicker kicker--plain">Lien client</span>
        <span className="stamp stamp--straight">Avis de paiement</span>
      </div>
      <h3>Un lien qui règle sans compte.</h3>
      <p>
        Envoyez-le par WhatsApp. Le client voit son solde, la référence{" "}
        {reference} et peut payer par MTN MoMo ou Orange Money.
      </p>
      <input
        ref={inputRef}
        className="share-card__url"
        value={origin ? url : `/payer/${token}`}
        readOnly
        aria-label="Lien public du dossier"
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="share-card__actions">
        <button type="button" className="share-card__copy" onClick={copy}>
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
        <a
          href={`/payer/${token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          Ouvrir l’aperçu client
        </a>
      </div>
    </section>
  );
}
