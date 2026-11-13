"use client";

import Link from "next/link";

import { PalabreMark } from "@/components/brand";
import { Fleche } from "@/components/fleche";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="garde-page">
      <header className="garde-bar">
        <div className="garde-bar__inner">
          <div className="garde-bar__brand">
            <PalabreMark className="garde-bar__mark" />
            <span className="garde-bar__word">PALABRE</span>
            <span className="garde-bar__kind">Carnet de comptes</span>
          </div>
          <span className="garde-bar__demo">Édition de démonstration</span>
        </div>
      </header>

      <main id="contenu" className="garde-main">
        <article className="garde-missing">
          <span className="stamp stamp--straight">Carnet fermé</span>
          <span className="garde-eyebrow">Incident de lecture</span>
          <h1>Le carnet ne répond pas.</h1>
          <p>
            La page n’a pas pu être lue jusqu’au bout. Vos écritures sont
            intactes : reprenez la lecture dans un instant.
          </p>
          <p className="garde-missing__note">
            Si le carnet reste fermé, vérifiez que le service PALABRE est bien
            démarré, puis rechargez la page.
          </p>
          <div className="garde-missing__actions">
            <button type="button" className="btn btn--ink" onClick={reset}>
              Réessayer
              <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
            </button>
            <Link href="/" className="text-link">
              Revenir à la présentation
            </Link>
          </div>
        </article>

        <footer className="garde-foot">
          <span>PALABRE · carnet de comptes · Douala</span>
          <span>Aucune écriture n’a été modifiée.</span>
        </footer>
      </main>
    </div>
  );
}
