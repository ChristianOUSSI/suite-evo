import Link from "next/link";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { NomComptoir } from "@/components/marque";

import "../styles/entree.css";

const GESTES = [
  {
    num: "01",
    titre: "Dicter la vente",
    texte:
      "« 2 fanta 900 momo ». L'article est reconnu dans le rayon, la quantité sort du stock, le bénéfice se fige au coût du jour.",
  },
  {
    num: "02",
    titre: "Racheter",
    texte:
      "« rachat 10 spaghetti 520 ». Le nouveau prix remélange le stock déjà là : le coût moyen se recalcule tout seul.",
  },
  {
    num: "03",
    titre: "Payer une sortie",
    texte:
      "« dépense taxi Bonanjo 1500 ». Transport, loyer, salaire ou facture : la journée garde sa part de sorties.",
  },
  {
    num: "04",
    titre: "Compter le tiroir",
    texte:
      "Le soir, le fond, le comptage et l'écart. L'écart reste écrit, même quand il fâche.",
  },
] as const;

export default function Presentation() {
  return (
    <div className="entree">
      <header className="fronton">
        <div className="gabarit fronton__rangee">
          <NomComptoir />
          <nav className="entree__nav" aria-label="Sorties de la présentation">
            <Link href="/connexion" className="bouton bouton--petit">
              Ouvrir le comptoir
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu">
        <section className="gabarit entree__accueil" aria-label="La promesse">
          <div>
            <span className="sur-titre">
              <Icone nom="voix" taille={13} /> Le cahier qui tient debout
            </span>
            <h1 className="display">
              Une phrase de dix secondes remplace la feuille du comptoir.
            </h1>
            <p className="entree__chapo">
              KOLO BOUTIQUE tient le stock, les ventes, les dépenses et le
              bénéfice d&apos;une alimentation générale de Douala. Le tenancier
              dicte, le cahier écrit. Personne ne ressort une calculette le
              dimanche soir.
            </p>
            <div className="acts">
              <Link href="/connexion" className="bouton bouton--encre">
                Ouvrir le comptoir
                <span className="bouton__fleche">
                  <Icone nom="fleche" taille={15} />
                </span>
              </Link>
              <span className="entree__prix">
                3&nbsp;000&nbsp;FCFA <small>par semaine et par boutique</small>
              </span>
            </div>
            <MentionDemo texte="Démo : une boutique inventée, un rayon garni de faux articles, aucun vocal WhatsApp reçu." />
          </div>

          <div className="entree__carte feuille feuille--decalee" aria-hidden="true">
            <p className="entree__carte-tete">Cahier du jour</p>
            <p className="entree__dictee">« 2 fanta 900 momo »</p>
            <ul className="entree__ecritures">
              <li>
                <span>Soda Fanta 1,5 L</span>
                <span className="mono">-2 · 1&nbsp;800</span>
              </li>
              <li>
                <span>Rachat spaghetti</span>
                <span className="mono">+10 · 5&nbsp;200</span>
              </li>
              <li>
                <span>Taxi Bonanjo</span>
                <span className="mono">-1&nbsp;500</span>
              </li>
            </ul>
            <p className="entree__carte-pied">
              Bénéfice du jour <span className="mono">4&nbsp;180 FCFA</span>
            </p>
          </div>
        </section>

        <section className="gabarit" aria-label="Les quatre gestes du comptoir">
          <div className="tete-feuille">
            <h2>Quatre gestes, pas un de plus</h2>
            <span className="tete-feuille__cote">Tenu par une seule main</span>
          </div>
          <ol className="entree__gestes">
            {GESTES.map((geste) => (
              <li className="entree__geste" key={geste.num}>
                <span className="entree__geste-num mono">{geste.num}</span>
                <h3>{geste.titre}</h3>
                <p>{geste.texte}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="gabarit entree__garde" aria-label="Ce qui est coupé">
          <div className="feuille bloc">
            <div className="tete-feuille">
              <h2>Ce que la démo ne fait pas</h2>
              <span className="tete-feuille__cote">Assumé à l&apos;écran</span>
            </div>
            <ul className="entree__liste">
              <li>
                <Icone nom="croix" taille={15} /> Aucun vocal n&apos;est reçu
                d&apos;un WhatsApp, aucune audio n&apos;est transcrite.
              </li>
              <li>
                <Icone nom="croix" taille={15} /> Une vente en MoMo est
                enregistrée comme payée : rien n&apos;est débité chez
                l&apos;opérateur.
              </li>
              <li>
                <Icone nom="croix" taille={15} /> Articles, clients et montants
                du jeu de démonstration sont fictifs.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="pied-page">
        <div className="gabarit pied-page__rangee">
          <p className="pied-page__note">
            Édition de démonstration : le stock, les ventes et les bénéfices de
            cette boutique sont inventés.
          </p>
          <div className="pied-page__meta">
            <span>CODE AXIS DIGITAL CAMEROON</span>
            <span>Douala</span>
            <Link href="/connexion">Comptoir</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
