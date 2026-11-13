import Link from "next/link";

import { PalabreMark } from "@/components/brand";

export default function NotFound() {
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
          <span className="stamp stamp--straight">Page introuvable</span>
          <span className="garde-eyebrow">Carnet de comptes</span>
          <h1>Cette page n’est pas au carnet.</h1>
          <p>
            L’adresse a peut-être changé, ou un caractère s’est perdu en route.
            Reprenez depuis le début : le carnet, lui, est resté à sa place.
          </p>
          <p className="garde-missing__note">
            Vous cherchiez un avis de paiement ? Demandez au commerçant de vous
            renvoyer son lien : chaque avis a sa propre adresse.
          </p>
          <div className="garde-missing__actions">
            <Link href="/" className="btn btn--ink">
              Revenir à la présentation
            </Link>
            <Link href="/connexion" className="text-link">
              Ouvrir mon carnet
            </Link>
          </div>
        </article>

        <footer className="garde-foot">
          <span>PALABRE · carnet de comptes · Douala</span>
          <span>Atelier CADC · données fictives</span>
        </footer>
      </main>
    </div>
  );
}
