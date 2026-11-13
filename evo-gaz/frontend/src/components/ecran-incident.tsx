import Link from "next/link";

import { NomProduit } from "./marque";

/**
 * La porte de   le dépôt se lit dans la layout : une page d'erreur ne peut
 * pas rattraper la layout de son propre segment. Sans cet écran, une API
 * éteinte montre l'écran du framework, en anglais, à un vendeur.
 */
export function EcranIncident({
  message,
  langue,
  t,
}: {
  message?: string;
  langue: string;
  t: (cle: string) => string;
}) {
  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit--etroit cadc-pile">
          <span className="cadc-badge cadc-badge--rouge">{t("commun.ferme")}</span>
          <h1 style={{ fontSize: "clamp(1.8rem,7vw,2.6rem)" }}>
            {langue === "en"
              ? "The depot is not answering."
              : "Le dépôt ne répond pas."}
          </h1>
          <p style={{ color: "var(--cadc-encre-2)" }}>
            {message ??
              (langue === "en"
                ? "The depot could not be opened. Check the API is running on the expected port, then come back."
                : "Le dépôt n'a pas pu être ouvert. Vérifie que l'API tourne sur le port attendu, puis repasse.")}
          </p>
          <p className="cadc-note cadc-note--acier">
            {langue === "en"
              ? "Nothing is lost: the vehicles logged and the clients noted stay in the lot."
              : "Rien n'est perdu : les livraisons notées et les clients tiennent dans le dépôt."}
          </p>
          <div className="cadc-acts">
            <Link href="/accueil" className="cadc-bouton cadc-bouton--premier">
              {t("commun.recharger")}
            </Link>
            <Link href="/connexion" className="cadc-bouton">
              {t("seance.ouvrir")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
