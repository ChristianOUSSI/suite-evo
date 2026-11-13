import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { Icone } from "@/components/icone";

// La porte de l'espace caisse n'a pas pu se ouvrir : l'API ne répond pas.
// Cet écran est le seul que la caissière doit voir dans ce cas, en français,
// avec la marque de l'école et pas celle du framework.
export function EcranIncident({
  message,
  detail,
}: {
  message?: string;
  detail?: string;
}) {
  return (
    <div className="workspace">
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="/app" />
        </div>
      </header>
      <main id="contenu" className="app-main">
        <div className="shell incident">
          <span className="kicker">
            <Icone nom="alerte" taille={14} /> Caisse fermée
          </span>
          <h1 className="display">
            La caisse de l&apos;école ne répond pas.
          </h1>
          <p>
            {message ??
              "Le registre n'a pas pu être ouvert. Vérifie que l'API tourne sur le port attendu, puis repasse par ici."}
          </p>
          {detail ? (
            <p className="vide-note mono">{detail}</p>
          ) : null}
          <div className="form-actions">
            <Link href="/app" className="btn btn--ink">
              Repasser
            </Link>
            <Link href="/connexion" className="btn">
              Rouvrir la séance
            </Link>
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <div className="shell app-footer__row">
          <span>ÉCOLE CASH · édition de démonstration</span>
          <span>Démo : aucun SMS, aucun débit MoMo</span>
        </div>
      </footer>
    </div>
  );
}
