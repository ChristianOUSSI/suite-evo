import Link from "next/link";
import "../styles/offre.css";

const DICTEE = [
  {
    quand: "0:01",
    qui: "voix",
    texte:
      "Bonjour, Institut Supérieur du Wouri, Standard de Bonapriso. " +
      "Naëlle vous écoute.",
  },
  {
    quand: "0:04",
    qui: "voix",
    texte:
      "1, horaires et adresses ; 2, inscriptions et scolarité ; 3, frais de " +
      "scolarité ; 4, prendre rendez-vous au guichet ; 5, laisser un message. " +
      "Pour une personne, touche 0.",
  },
  {
    quand: "0:19",
    qui: "appelant",
    texte: "Je voudrais savoir ce qu'il faut apporter pour un dossier.",
  },
  {
    quand: "0:24",
    qui: "voix",
    texte:
      "Il faut l'acte de naissance, la copie certifiée du dernier diplôme, " +
      "quatre bulletins, deux photos d'identité et la quittance des frais. " +
      "Le guichet reçoit les dépôts du lundi au vendredi, entre 8 h et 15 h.",
  },
  {
    quand: "0:41",
    qui: "appelant",
    texte: "Je peux passer demain matin ?",
  },
  {
    quand: "0:45",
    qui: "voix",
    texte:
      "Le retrait de dossier, c'est quinze minutes. Je peux vous poser " +
      "mardi 28 octobre à 9 h 00, ou jeudi 30 octobre à 14 h 00. " +
      "Touchez la case qui vous arrange.",
  },
];

const METIERS = [
  {
    doigt: "1",
    titre: "Le répertoire parlé",
    texte:
      "Vos fiches, écrites comme on répond au comptoir. La voix garde la " +
      "dictée courte : deux cent soixante signes, une respiration.",
  },
  {
    doigt: "2",
    titre: "Les guichets",
    texte:
      "Un créneau par tranche de quinze ou trente minutes, une journée d'avance, " +
      "deux semaines d'horizon. La place posée porte une référence dictable.",
  },
  {
    doigt: "3",
    titre: "La main courante",
    texte:
      "Un mot laissé est une promesse : date, heure, urgence. Ce qui dépasse " +
      "la fenêtre de rappel monte en retard sur la plaque du matin.",
  },
  {
    doigt: "4",
    titre: "Les touches et les postes",
    texte:
      "Trois postes, un arbre de touches par poste, des horaires par jour et " +
      "des fermetures qui passent avant tout le reste.",
  },
  {
    doigt: "9",
    titre: "Le Cameroun est deux fois chez lui",
    texte:
      "Touche 9 et la voix passe à l'anglais : salutation, fiches, rendez-vous " +
      "et accusés de message suivent l'appelant jusqu'au bout. Le journal " +
      "sort chaque matin en feuille de calcul, point-virgule et BOM, pour la " +
      "direction comme pour la comptabilité.",
  },
];

export default function Offre() {
  return (
    <main className="offre">
      <header className="entete">
        <div className="marque">
          <b>CADC VOICE</b>
          <span>Standard tenu par la voix</span>
        </div>
        <nav>
          <Link href="/#ce-que-ca-fait">Ce que ça fait</Link>
          <Link href="/#tarifs">Tarifs</Link>
          <Link href="/connexion">Ouvrir la console</Link>
        </nav>
      </header>

      <section className="ouverture">
        <div>
          <h1>Le standard décroche à la première sonnerie</h1>
          <p className="chapeau">
            À 7 h 30, l'accueil d'un institut de Bonapriso reçoit douze appels en
            dix minutes : les horaires, les pièces du dossier, la deuxième
            tranche, l'internat. CADC VOICE tient les trois premiers, note les
            autres, pose les rendez-vous au guichet et rappelle qui doit l'être.
            Une personne reste dans la boucle, elle ne fait plus la plaquette.
          </p>
          <div className="rappel">
            <Link className="bouton" href="/connexion">
              Entrer dans la console
            </Link>
            <Link className="bouton sobre" href="/#demo">
              Ce qui est simulé
            </Link>
          </div>
          <div className="chiffres">
            <div>
              <b>3 min</b>
              <span>économisées par appel tenu</span>
            </div>
            <div>
              <b>1 400</b>
              <span>appels par mois sur un poste</span>
            </div>
            <div>
              <b>75 000</b>
              <span>FCFA par mois, institution</span>
            </div>
          </div>
        </div>

        <div className="poste-carte">
          <h2>Un appel du 27 octobre</h2>
          <dl className="appel-fil">
            {DICTEE.map((ligne) => (
              <div className={ligne.qui} key={ligne.quand}>
                <dt>{ligne.quand}</dt>
                <dd>{ligne.texte}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section" id="ce-que-ca-fait">
        <h2>Cinq réglages, et le standard tient debout</h2>
        <p className="intro">
          Rien n'est livré « intelligent ». Chaque phrase que la voix prononce
          vient d'une fiche que votre agent a écrite, chaque rendez-vous vient
          d'un guichet dont vous avez posé les heures.
        </p>
        <div className="metiers">
          {METIERS.map((metier) => (
            <article className="metier" key={metier.doigt}>
              <span className="doigt">touche {metier.doigt}</span>
              <h3>{metier.titre}</h3>
              <p>{metier.texte}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="tarifs">
        <h2>Tarifs en FCFA, sans engagement de douze mois</h2>
        <table className="tarifs">
          <caption>
            Facturation mensuelle. Les appels entrants sont au tarif de votre
            opérateur, la plateforme ne prend pas de commission dessus.
          </caption>
          <thead>
            <tr>
              <th scope="col">Formule</th>
              <th scope="col">Ce que la voix tient</th>
              <th scope="col">Postes</th>
              <th scope="col">Mensuel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Comptoir</th>
              <td>Horaires, adresses, un guichet de rendez-vous</td>
              <td>1</td>
              <td className="chiffrage">25 000 FCFA</td>
            </tr>
            <tr>
              <th scope="row">Standard</th>
              <td>
                Répertoire complet, trois guichets, main courante, rappels SMS
              </td>
              <td>3</td>
              <td className="chiffrage">45 000 FCFA</td>
            </tr>
            <tr className="complet">
              <th scope="row">Institution</th>
              <td>
                Plusieurs postes, transferts, journal exporté chaque matin,
                accompagnement du fonds de réponses
              </td>
              <td>12</td>
              <td className="chiffrage">75 000 FCFA</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="demo" id="demo">
        <div>
          <h2>Démo, pas télécom</h2>
          <div className="identifiants">
            standard@iswouri.cm
            <br />
            Voix2026!
          </div>
        </div>
        <div>
          <p>
            Cette installation tourne en démonstration. Aucun opérateur n'est
            appelé, aucun SMS ne part : les fiches d'appel, les rendez-vous et
            les envois portent une référence qui commence par DEM. Les
            numéros affichés suivent le plan camerounais, les montants sont en
            FCFA, et le fonds de réponses est rempli avec les questions
            réellement posées à un standard de Bonapriso.
          </p>
          <p style={{ marginTop: 12 }}>
            Brancher un vrai tronc SIP ou un agrégateur SMS reste un travail
            d'intégration chiffré séparément.
          </p>
        </div>
      </section>

      <footer className="pied">
        <span>CADC, atelier de Douala</span>
        <span>Bonapriso, Douala</span>
      </footer>
    </main>
  );
}
