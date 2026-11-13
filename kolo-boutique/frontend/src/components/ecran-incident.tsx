import Link from "next/link";

import { Icone } from "./icone";
import { NomComptoir } from "./marque";

// La porte du comptoir se lit dans la layout : une page d’erreur ne peut pas
// rattraper la layout de son propre segment. Sans cet écran, une API éteinte
// montre l’écran du framework, en anglais, au tenancier.
export function EcranIncident({ message }: { message?: string }) {
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
            <Icone nom="alerte" taille={13} /> Comptoir fermé
          </span>
          <h1 className="display">Le comptoir ne répond pas.</h1>
          <p>
            {message ??
              "Le cahier n’a pas pu être ouvert. Vérifie que l’API tourne sur le port attendu, puis repasse par ici."}
          </p>
          <p className="note-bas">
            Rien n’est perdu : les ventes, les rachats et les dépenses du jour
            attendent dans le cahier.
          </p>
          <div className="acts">
            <Link href="/comptoir" className="bouton bouton--encre">
              Reprendre
              <span className="bouton__fleche">
                <Icone nom="fleche" taille={15} />
              </span>
            </Link>
            <Link href="/connexion" className="lien-simple">
              Rouvrir la séance
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
