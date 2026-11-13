import Link from "next/link";

import { PalabreMark } from "@/components/brand";

import "../../../styles/payer.css";
import { Fleche } from "@/components/fleche";

export default function PayerNotFound() {
  return (
    <div className="garde-page">
      <header className="garde-bar">
        <div className="garde-bar__inner">
          <div className="garde-bar__brand">
            <PalabreMark className="garde-bar__mark" />
            <span className="garde-bar__word">PALABRE</span>
            <span className="garde-bar__kind">Avis de paiement</span>
          </div>
          <span className="garde-bar__demo">Édition de démonstration</span>
        </div>
      </header>

      <main id="contenu" className="garde-main">
        <article className="garde-missing">
          <span className="stamp stamp--straight">Lien inactif</span>
          <span className="garde-eyebrow">Avis de paiement</span>
          <h1>Cet avis n’est plus accessible.</h1>
          <p>
            Le lien a peut-être été remplacé, ou la facture a été retirée du
            carnet. Demandez au commerçant de vous renvoyer son avis de
            paiement.
          </p>
          <p className="garde-missing__note">
            Si vous l’avez reçu par WhatsApp, vérifiez que le message n’a pas
            coupé le lien en deux.
          </p>
          <Link href="/" className="btn">
            Découvrir PALABRE
            <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
          </Link>
        </article>

        <section
          className="payer-demo payer-demo--narrow"
          aria-label="Mention de démonstration"
        >
          <span className="stamp stamp--gold stamp--straight">Démonstration</span>
          <p>
            PALABRE tourne ici en édition de démonstration, avec des carnets
            inventés. Aucun avis véritable ne peut être atteint par ce lien, et
            aucun compte Mobile Money n’est débité.
          </p>
        </section>

        <footer className="garde-foot">
          <span>PALABRE · carnet de comptes · Douala</span>
          <span>Aucun paiement n’a été effectué.</span>
        </footer>
      </main>
    </div>
  );
}
