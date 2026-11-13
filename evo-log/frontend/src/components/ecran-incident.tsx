import Link from "next/link";

import { NomProduit } from "./marque";

/**
 * La porte de l'agence se lit dans la layout : une page d'erreur ne peut
 * pas rattraper la layout de son propre segment. Sans cet écran, une API
 * éteinte montre l'écran du framework, en anglais, à une réceptionniste.
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
              ? "The register is not answering."
              : "Le registre ne répond pas."}
          </h1>
          <p style={{ color: "var(--cadc-encre-2)" }}>
            {message ??
              (langue === "en"
                ? "The register could not be opened. Check the API is running on the expected port, then come back."
                : "Le registre n'a pas pu être ouvert. Vérifie que l'API tourne sur le port attendu, puis repasse.")}
          </p>
          <p className="cadc-note cadc-note--acier">
            {langue === "en"
              ? "Nothing is lost: the parcels checked in and the statuses moved stay in the register."
              : "Rien n'est perdu : les colis déposés et les statuts avancés tiennent dans le registre."}
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
