"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErreurConsole({
  erreur,
  reessayer,
}: {
  erreur: Error & { digest?: string };
  reessayer: () => void;
}) {
  useEffect(() => {
    console.error(erreur);
  }, [erreur]);

  return (
    <div className="rate">
      <h1>La console n'a pas pu charger cette page</h1>
      <p>
        L'API du standard ne répond pas, ou la session a vieilli. Les fiches déjà
        écrites ne bougent pas : elles attendent dans la base.
      </p>
      <p className="detail">
        Le détail technique reste dans la console du navigateur pour celui qui
        dépanne ; ici, seule la reprise compte.
      </p>
      <div className="ligne-action">
        <button className="bouton" type="button" onClick={reessayer}>
          Redemander la page
        </button>
        <Link className="bouton sobre" href="/connexion">
          Revenir à la connexion
        </Link>
      </div>
    </div>
  );
}
