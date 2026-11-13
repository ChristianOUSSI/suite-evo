import Link from "next/link";

import { Fleche } from "@/components/fleche";
import { Wordmark } from "@/components/brand";

// La porte du carnet se lit dans la layout : une page d'erreur ne peut pas
// rattraper la layout de son propre segment. Sans cet écran, un API éteinte
// montre l'écran du framework, en anglais, à la place du carnet.
export function WorkspaceOffline({ message }: { message?: string }) {
  return (
    <div className="workspace">
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="/app" />
        </div>
      </header>
      <main id="contenu" className="app-main">
        <div className="shell app-missing">
          <div className="app-missing__head">
            <span className="kicker">Carnet fermé</span>
            <span className="stamp stamp--straight">À reprendre</span>
          </div>
          <h1>Le carnet de comptes ne répond pas.</h1>
          <p>
            {message ??
              "L'API de PALABRE n'a pas répondu. Vérifiez qu'elle tourne sur le port attendu, puis reprenez ici."}
          </p>
          <p className="app-missing__note">
            Rien n’est perdu : vos créances, vos relances et vos encaissements
            attendent dans le registre.
          </p>
          <div className="app-missing__actions">
            <Link href="/app" className="btn btn--ink">
              Reprendre la lecture
              <span className="btn__arrow" aria-hidden="true">
                <Fleche />
              </span>
            </Link>
            <Link href="/connexion" className="text-link">
              Rouvrir la séance
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
