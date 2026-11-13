import Link from "next/link";

// La porte de la console se lit dans la layout : une page d'erreur ne peut pas
// rattraper la layout de son propre segment. Sans cet écran, un standard éteint
// montre l'écran du framework, en anglais, à l'opératrice.
export function EcranStandardEteint({ message }: { message?: string }) {
  return (
    <div className="console">
      <main className="zone">
        <div className="rate">
          <h1>Le standard ne répond pas.</h1>
          <p>
            {message ??
              "L'API de CADC VOICE n'a pas répondu. Vérifie qu'elle tourne sur le port attendu, puis reviens ici."}
          </p>
          <p>
            Rien n'est perdu : les appels déjà consignés, les rendez-vous pris au
            guichet et les messages attendent dans la base.
          </p>
          <div className="ligne-action">
            <Link className="bouton" href="/tableau">
              Reprendre la lecture
            </Link>
            <Link className="bouton sobre" href="/connexion">
              Rouvrir la séance
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
