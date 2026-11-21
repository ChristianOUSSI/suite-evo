import Link from "next/link";

import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";

import { Icone } from "./icone";
import { NomComptoir } from "./marque";

// La porte du comptoir se lit dans la layout : une page d’erreur ne peut pas
// rattraper la layout de son propre segment. Sans cet écran, une API éteinte
// montre l’écran du framework, en anglais, au tenancier.
export function EcranIncident({
  message,
  langue = LANGUE_DEFAUT,
}: {
  message?: string;
  langue?: Langue;
}) {
  return (
    <div className="comptoir-chantier">
      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir href="/comptoir" langue={langue} />
        </div>
      </header>
      <main id="contenu" className="chantier">
        <div className="gabarit incident">
          <span className="sur-titre">
            <Icone nom="alerte" taille={13} /> {t("incident.ferme", langue)}
          </span>
          <h1 className="display">{t("incident.titre", langue)}</h1>
          <p>{message ?? t("incident.texte", langue)}</p>
          <p className="note-bas">{t("incident.note", langue)}</p>
          <div className="acts">
            <Link href="/comptoir" className="bouton bouton--encre">
              {t("incident.reprendre", langue)}
              <span className="bouton__fleche">
                <Icone nom="fleche" taille={15} />
              </span>
            </Link>
            <Link href="/connexion" className="lien-simple">
              {t("incident.rouvrir", langue)}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
