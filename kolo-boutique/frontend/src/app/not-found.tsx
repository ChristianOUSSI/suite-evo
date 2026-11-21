import Link from "next/link";

import { Icone } from "@/components/icone";
import { NomComptoir } from "@/components/marque";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";

export default async function Introuvable() {
  const langue = await langueServeur();
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
            <Icone nom="croix" taille={13} /> {t("introuvable.sur-titre", langue)}
          </span>
          <h1 className="display">{t("introuvable.titre", langue)}</h1>
          <p>{t("introuvable.texte", langue)}</p>
          <div className="acts">
            <Link href="/comptoir" className="bouton bouton--encre">
              {t("introuvable.reprendre", langue)}
              <span className="bouton__fleche">
                <Icone nom="fleche" taille={15} />
              </span>
            </Link>
            <Link href="/" className="lien-simple">
              {t("introuvable.voir", langue)}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
