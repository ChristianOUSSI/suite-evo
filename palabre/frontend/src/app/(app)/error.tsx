"use client";

import Link from "next/link";
import { Fleche } from "@/components/fleche";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell app-missing">
      <div className="app-missing__head">
        <span className="kicker">Incident de lecture</span>
        <span className="stamp stamp--straight">À reprendre</span>
      </div>
      <h1>La feuille n’a pas pu s’ouvrir.</h1>
      <p>
        Le carnet n’a pas répondu jusqu’au bout. Vos montants et vos dates sont
        intacts : reprenez la lecture dans un instant.
      </p>
      <p className="app-missing__note">
        Si cela se répète, vérifiez que le service PALABRE est bien démarré.
      </p>
      <div className="app-missing__actions">
        <button type="button" className="btn btn--ink" onClick={reset}>
          Reprendre la lecture
          <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
        </button>
        <Link href="/app" className="text-link">
          Revenir au journal
        </Link>
      </div>
    </div>
  );
}
