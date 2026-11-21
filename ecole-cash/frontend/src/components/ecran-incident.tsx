import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { Icone } from "@/components/icone";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";

// La porte de l'espace caisse n'a pas pu s'ouvrir : l'API ne répond pas.
// Cet écran est le seul que la caissière doit voir dans ce cas, avec la
// marque de l'école et pas celle du framework.
export function EcranIncident({
  message,
  detail,
  langue = LANGUE_DEFAUT,
}: {
  message?: string;
  detail?: string;
  langue?: Langue;
}) {
  return (
    <div className="workspace">
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="/app" langue={langue} />
        </div>
      </header>
      <main id="contenu" className="app-main">
        <div className="shell incident">
          <span className="kicker">
            <Icone nom="alerte" taille={14} /> {t("incident.ferme", langue)}
          </span>
          <h1 className="display">{t("incident.titre", langue)}</h1>
          <p>{message ?? t("incident.message", langue)}</p>
          {detail ? (
            <p className="vide-note mono">{detail}</p>
          ) : null}
          <div className="form-actions">
            <Link href="/app" className="btn btn--ink">
              {t("incident.repasser", langue)}
            </Link>
            <Link href="/connexion" className="btn">
              {t("incident.rouvrir", langue)}
            </Link>
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <div className="shell app-footer__row">
          <span>
            ÉCOLE CASH · {t("pied.edition", langue)}
          </span>
          <span>{t("pied.demo", langue)}</span>
        </div>
      </footer>
    </div>
  );
}
