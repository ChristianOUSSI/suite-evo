import Link from "next/link";

import { Icone } from "@/components/icone";
import { NomComptoir } from "@/components/marque";

export default function Introuvable() {
  return (
    <div className="comptoir-chantier">
      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir href="/comptoir" />
        </div>
      </header>
      <main id="contenu" className="chantier">
        <div className="gabarit incident">
          <span className="sur-titre">
            <Icone nom="croix" taille={13} /> Page hors du cahier
          </span>
          <h1 className="display">Cette page n’est écrite nulle part.</h1>
          <p>
            Le comptoir ne connaît qu’une journée, une dictée, un rayon, des
            ventes, un tiroir et ses réglages. Rien de plus.
          </p>
          <div className="acts">
            <Link href="/comptoir" className="bouton bouton--encre">
              Reprendre la journée
              <span className="bouton__fleche">
                <Icone nom="fleche" taille={15} />
              </span>
            </Link>
            <Link href="/" className="lien-simple">
              Voir la boutique présentée
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
