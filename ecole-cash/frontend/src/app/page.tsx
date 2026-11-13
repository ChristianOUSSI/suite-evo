import type { Metadata } from "next";
import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { Icone } from "@/components/icone";

import "../styles/entree.css";
import "../styles/landing.css";

export const metadata: Metadata = {
  description:
    "La caisse des écoles privées de 150 à 2 000 élèves : encaissement au guichet, reçu WhatsApp immédiat, relances programmées, comptage du soir.",
};

const GESTES = [
  {
    titre: "Encaisser",
    texte:
      "Le montant dû est déjà coupé en tranches. On saisit l'élève, le mode, le montant : les imputations se posent du terme le plus ancien au plus récent.",
  },
  {
    titre: "Remettre le reçu",
    texte:
      "Numéro, jeton de vérification et texte du message sont écrits à l'encaissement. Le parent fait vérifier son reçu depuis n'importe quel téléphone.",
  },
  {
    titre: "Relancer",
    texte:
      "Quatre paliers par terme : sept jours avant, le jour dit, le premier retard, le dernier avis. Le ton est courtois ou ferme, jamais improvisé.",
  },
  {
    titre: "Compter le tiroir",
    texte:
      "Le soir, on note le fond et le comptage. L'écart reste ouvert à l'écran tant qu'il n'est pas expliqué.",
  },
];

export default function Accueil() {
  return (
    <>
      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark href="" />
          <nav className="app-nav" aria-label="Navigation du site">
            <Link href="/connexion" className="app-nav__link">
              <Icone nom="caisse" taille={16} />
              Ouvrir la caisse
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenu">
        <section className="shell entree__corps">
          <div className="entree__promo">
            <span className="kicker">
             CODE AXIS DIGITAL CAMEROON · Douala
            </span>
            <h1 className="display">
              Les frais de
              <br />
              scolarité, tenus
              <br />
              comme un cahier.
            </h1>
            <p>
              ÉCOLE CASH remplace le classeur à spirale de la caisse. Il tient
              sur un téléphone à 25 000 F, une connexion qui coupe, et il ne
              demande aucune carte bancaire à personne.
            </p>
            <div className="form-actions">
              <Link href="/connexion" className="btn btn--ink">
                Voir la caisse de démonstration
                <span className="btn__fleche" aria-hidden="true">
                  <Icone nom="fleche" taille={15} />
                </span>
              </Link>
              <Link href="/verif/DEMO-JETON" className="btn btn--quiet">
                Vérifier un reçu
              </Link>
            </div>
          </div>

          <div className="sheet sheet--offset bloc">
            <span className="eyebrow">Prix</span>
            <p className="prix">15 000 FCFA</p>
            <p className="prix__suite">par école et par mois, sans engagement.</p>
            <hr className="divider divider--ink" />
            <ul className="entree__liste">
              <li>
                <Icone nom="check" taille={16} />
                Écoles de 150 à 2 000 élèves.
              </li>
              <li>
                <Icone nom="check" taille={16} />
                Directrice, comptable et surveillante sur la même caisse.
              </li>
              <li>
                <Icone nom="check" taille={16} />
                Feuilles CSV à remettre à la trésorière ou au comptable.
              </li>
            </ul>
          </div>
        </section>

        <section className="shell" aria-label="Les quatre gestes">
          <div className="section-head">
            <h2>Ce que la caissière fait, quatre fois par jour</h2>
            <span className="section-head__aside">Rien d'autre à apprendre</span>
          </div>
          <ol className="gestes">
            {GESTES.map((geste, index) => (
              <li className="geste" key={geste.titre}>
                <span className="geste__num mono">{String(index + 1).padStart(2, "0")}</span>
                <h3>{geste.titre}</h3>
                <p>{geste.texte}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__row">
          <p className="site-footer__note">
            Édition de démonstration : les élèves, les parents et les paiements
            de cette caisse sont inventés. Aucun message n'est envoyé.
          </p>
          <div className="site-footer__meta">
            <span>CODE AXIS DIGITAL CAMEROON</span>
            <span>Bonabéri, Douala</span>
            <Link href="/connexion">Connexion</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
