import Link from "next/link";

import { Wordmark } from "@/components/brand";
import { MessagePreview } from "@/components/message-preview";
import { initials } from "@/lib/format";

import "../styles/landing.css";
import { Fleche } from "@/components/fleche";

const LEDGER_ROWS = [
  {
    customer: "Chantier Simbock",
    reference: "PAL-2026-0004",
    label: "Fer, gravier et location de pompe",
    amount: "950 000",
    state: "Promesse",
    tag: "tag--promise",
  },
  {
    customer: "Mme Adèle Tchoumi",
    reference: "PAL-2026-0005",
    label: "Peinture et enduit, villa de Makepe",
    amount: "95 000",
    state: "12 j de retard",
    tag: "tag--late",
  },
  {
    customer: "École Les Palmiers",
    reference: "PAL-2026-0006",
    label: "Réfection de 8 salles de classe",
    amount: "480 000",
    state: "Promesse",
    tag: "tag--promise",
  },
  {
    customer: "Clinique du Littoral",
    reference: "PAL-2026-0007",
    label: "Vitrerie et quincaillerie, aile ouest",
    amount: "725 000",
    state: "4 j de retard",
    tag: "tag--late",
  },
];

const SECTORS = [
  {
    name: "Quincailleries et dépôts",
    note: "Ciment, fer, tôles. Des créances qui pèsent vite lourd.",
  },
  {
    name: "Grossistes et demi-grossistes",
    note: "Des dizaines de clients, souvent les mêmes têtes.",
  },
  {
    name: "Écoles et centres de formation",
    note: "Des échéances par trimestre, des familles à relancer avec tact.",
  },
  {
    name: "Cliniques et laboratoires",
    note: "Des prestations réglées en retard, sans envie de se fâcher.",
  },
  {
    name: "Ateliers et menuiseries",
    note: "La commande est livrée. Reste le solde, et la mémoire.",
  },
  {
    name: "Prestataires et PME",
    note: "Des factures propres, des paiements qui traînent.",
  },
];

const QUESTIONS = [
  {
    question: "Mon client n’a pas WhatsApp.",
    answer:
      "Le carnet prévoit aussi le SMS et le vocal. Si un canal est désactivé, la séquence bascule sur un autre. Le client peut répondre STOP : ses relances s’arrêtent.",
  },
  {
    question: "Je tiens déjà mes comptes dans un cahier.",
    answer:
      "C’est le point de départ. Les lignes du cahier entrent dans PALABRE par lot, avec le client, l’objet, le montant, l’échéance et le quartier. Vous gardez vos références, le carnet tient la chronologie.",
  },
  {
    question: "Comment mon client paie ?",
    answer:
      "Depuis un lien à son nom, avec MTN MoMo ou Orange Money. Le reçu porte une référence et le solde du dossier se met à jour. Dans cette démonstration, aucun débit réel n’est effectué.",
  },
  {
    question: "Est-ce que les messages partent tout seuls ?",
    answer:
      "La séquence est préparée automatiquement. Vous lancez la tournée quand vous êtes prêt. Un litige met le dossier en pause, une promesse le calme. Le ton courtois ou ferme se choisit dans les réglages.",
  },
  {
    question: "Mes données sont-elles partagées ?",
    answer:
      "Chaque commerce ne voit que son propre carnet. Cette démonstration utilise une base locale et des données fictives. Aucun client réel n’est contacté.",
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="dateline">
        <div className="shell">
          <span>Atelier CADC · Douala</span>
          <span className="dateline__side dateline__side--right">
            PALABRE · édition de démonstration
          </span>
        </div>
      </div>

      <header className="masthead">
        <div className="shell masthead__row">
          <Wordmark />
          <nav className="landing-nav" aria-label="Sommaire">
            <a href="#methode">La méthode</a>
            <a href="#relance">La relance</a>
            <a href="#carnet">Le carnet</a>
            <a href="#prix">Le prix</a>
          </nav>
          <Link href="/connexion" className="btn btn--ink btn--small">
            Entrer dans la démo
            <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
          </Link>
        </div>
      </header>

      <main id="contenu">
        <section className="hero">
          <div className="shell hero__grid">
            <div className="hero__copy">
              <span className="kicker">
                Recouvrement pour commerces de Douala
              </span>
              <h1 className="hero__title">
                L’argent qui dort
                <br />
                dans vos <em>carnets</em>.
              </h1>
              <p className="hero__lede">
                PALABRE rassemble les factures impayées de votre commerce,
                relance vos clients au bon moment et vous dit, chaque matin, où
                est votre argent. Sans tableur, sans agence, sans menaces.
              </p>
              <div className="hero__actions">
                <Link href="/connexion" className="btn btn--stamp">
                  Ouvrir le carnet de démonstration
                  <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
                </Link>
                <a href="#methode" className="text-link">
                  Voir la méthode
                </a>
              </div>
              <p className="hero__fineprint">
                Démonstration ouverte · données fictives · paiements simulés
              </p>
            </div>

            <aside className="hero__ledger">
              <div className="ledgercard">
                <span className="ledgercard__tape" aria-hidden="true" />
                <div className="ledgercard__head">
                  <span>Carnet de caisse</span>
                  <span>Feuille 41</span>
                </div>
                <div className="ledgercard__merchant">
                  <h2>Quincaillerie Nana &amp; Fils</h2>
                  <p>Mboppi, Douala · 12 clients au carnet</p>
                </div>
                <dl className="ledgercard__rows">
                  <div className="ledgercard__row">
                    <dt>Encours total</dt>
                    <dd>5 255 000 FCFA</dd>
                  </div>
                  <div className="ledgercard__row ledgercard__row--alert">
                    <dt>Dont échu</dt>
                    <dd>4 190 000 FCFA</dd>
                  </div>
                  <div className="ledgercard__row">
                    <dt>Encaissé ce mois</dt>
                    <dd>1 355 000 FCFA</dd>
                  </div>
                </dl>
                <div className="ledgercard__bottom">
                  <p className="ledgercard__note">
                    L’école Les Palmiers a promis de passer cet après-midi.
                    <span>Promesse notée le 22 octobre</span>
                  </p>
                  <span className="stamp ledgercard__stamp">Suivre</span>
                </div>
              </div>
              <p className="hero__caption">
                Extrait du carnet de démonstration. Les noms, montants et dates
                sont fictifs.
              </p>
            </aside>
          </div>
        </section>

        <section className="strip" aria-label="Types de commerces">
          <ul className="shell strip__row">
            <li>Quincailleries</li>
            <li>Grossistes</li>
            <li>Écoles privées</li>
            <li>Cliniques</li>
            <li>Ateliers</li>
            <li>PME de services</li>
          </ul>
        </section>

        <section className="problem shell" id="methode">
          <div className="problem__aside">
            <span className="kicker">Ce qui se passe vraiment</span>
            <blockquote className="problem__note">
              « Le client n’est pas forcément malhonnête. Il a oublié, il attend
              un autre chantier, ou il n’a pas vu la facture. »
              <cite>Le carnet, Mboppi</cite>
            </blockquote>
          </div>
          <div className="problem__body">
            <h2>
              Une facture impayée n’est pas un trou. C’est une conversation qui
              n’a pas eu lieu.
            </h2>
            <div className="problem__cols">
              <p>
                Une créance se range dans un tiroir, passe sous une autre
                commande, et finit par coûter plus cher en temps qu’en argent.
                Le patron connaît le client, mais plus la date exacte. Le
                client, lui, a perdu le papier.
              </p>
              <p>
                PALABRE ne remplace pas votre relation avec le client. Il tient
                le fil : la date, le montant, le message envoyé, la promesse
                reçue, le franc encaissé. Vous gardez la main sur le ton et sur
                le moment.
              </p>
            </div>
            <ol className="problem__principles">
              <li>
                <span>01</span>
                <strong>Un seul registre</strong>
                <small>
                  Clients, factures, promesses et règlements réunis dans la
                  même feuille.
                </small>
              </li>
              <li>
                <span>02</span>
                <strong>Des relances datées</strong>
                <small>
                  SMS, WhatsApp et vocal, de J-3 à J+14, avec un ton que vous
                  choisissez.
                </small>
              </li>
              <li>
                <span>03</span>
                <strong>Une caisse qui suit</strong>
                <small>
                  Chaque paiement met le dossier à jour. Le reçu porte une
                  référence.
                </small>
              </li>
            </ol>
          </div>
        </section>

        <section className="method">
          <div className="shell">
            <div className="method__top">
              <div>
                <span className="kicker">La méthode</span>
                <h2>Trois gestes, pas une formation.</h2>
              </div>
              <p>
                Le carnet reprend la manière de travailler d’un commerce de
                quartier. On inscrit, on relance, on encaisse. Ce qui change,
                c’est que rien ne se perd entre deux journées chargées.
              </p>
            </div>
            <ol className="method__list">
              <li className="method__item">
                <span className="method__number">01</span>
                <div>
                  <h3>On inscrit.</h3>
                  <p>
                    Le carnet existant entre par lot. Une créance se crée aussi
                    en une minute, avec le client, l’objet, l’échéance et le
                    quartier. Le numéro de téléphone devient le fil du dossier.
                  </p>
                  <span className="method__meta">
                    Import du carnet · Saisie directe
                  </span>
                </div>
              </li>
              <li className="method__item">
                <span className="method__number">02</span>
                <div>
                  <h3>On laisse filer la séquence.</h3>
                  <p>
                    Selon l’échéance, le carnet prépare un SMS, un WhatsApp ou
                    un vocal. Vous relancez à la main quand il le faut, vous
                    notez une promesse, vous mettez un litige de côté.
                  </p>
                  <span className="method__meta">
                    Séquence J-3 à J+14 · Texte relu
                  </span>
                </div>
              </li>
              <li className="method__item">
                <span className="method__number">03</span>
                <div>
                  <h3>On encaisse.</h3>
                  <p>
                    Le client ouvre son lien, règle par MTN MoMo ou Orange
                    Money. Le paiement s’inscrit dans le dossier, le solde
                    change, le reçu garde sa référence. Un paiement partiel peut
                    tout à fait exister.
                  </p>
                  <span className="method__meta">
                    Lien de paiement · Reçu numéroté
                  </span>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="relance shell" id="relance">
          <div className="relance__grid">
            <div className="relance__copy">
              <span className="kicker">La relance</span>
              <h2>Le bon mot. Le bon canal.</h2>
              <p>
                Le ton se règle une fois. Les messages restent courts, signés,
                et respectent l’opt-out. Le vocal existe pour les clients qui ne
                lisent pas les SMS. Rien ne part sans que vous ayez vu la
                séquence.
              </p>
              <dl className="relance__steps">
                <div className="relance__step">
                  <dt>J-3</dt>
                  <dd>
                    <strong>SMS.</strong> Un rappel léger avant l’échéance.
                  </dd>
                </div>
                <div className="relance__step">
                  <dt>J0</dt>
                  <dd>
                    <strong>WhatsApp.</strong> Le lien de paiement, le jour
                    même.
                  </dd>
                </div>
                <div className="relance__step">
                  <dt>J+3</dt>
                  <dd>
                    <strong>WhatsApp.</strong> Une question simple, pas une
                    sommation.
                  </dd>
                </div>
                <div className="relance__step">
                  <dt>J+7</dt>
                  <dd>
                    <strong>SMS.</strong> Le solde et le lien, avec l’option
                    STOP.
                  </dd>
                </div>
                <div className="relance__step">
                  <dt>J+14</dt>
                  <dd>
                    <strong>Vocal.</strong> Une voix posée pour les clients qui
                    ne lisent pas.
                  </dd>
                </div>
              </dl>
            </div>
            <MessagePreview />
          </div>
        </section>

        <section className="carnet shell" id="carnet">
          <div className="section-head">
            <div>
              <span className="kicker">Le carnet, en clair</span>
              <h2>Ce que le patron voit le matin.</h2>
            </div>
            <span className="section-head__aside">
              Extrait de la démonstration · Mboppi
            </span>
          </div>
          <div className="carnet__grid">
            <div className="sample-ledger">
              <div className="sample-ledger__head" aria-hidden="true">
                <span>Dossier</span>
                <span>Objet</span>
                <span>Solde</span>
                <span>État</span>
              </div>
              {LEDGER_ROWS.map((row) => (
                <div className="sample-ledger__row" key={row.reference}>
                  <div className="sample-ledger__client">
                    <span className="avatar" aria-hidden="true">
                      {initials(row.customer)}
                    </span>
                    <span>
                      <strong>{row.customer}</strong>
                      <small>{row.reference}</small>
                    </span>
                  </div>
                  <span className="sample-ledger__label">{row.label}</span>
                  <span className="sample-ledger__amount">
                    {row.amount}
                    <small>FCFA</small>
                  </span>
                  <span className="sample-ledger__state">
                    <span className={`tag ${row.tag}`}>{row.state}</span>
                  </span>
                </div>
              ))}
              <div className="sample-ledger__foot">
                <span>
                  12 clients · 23 créances · 4 190 000 FCFA échus
                </span>
                <Link href="/connexion" className="text-link">
                  Ouvrir le carnet complet
                </Link>
              </div>
            </div>

            <aside className="carnet__note">
              <span className="stamp">Chronologie tenue</span>
              <blockquote className="carnet__quote">
                « Une relance n’est pas une menace. C’est une date, un montant,
                et quelqu’un qui répond. »
              </blockquote>
              <dl className="carnet__figures">
                <div>
                  <dt>Échu au carnet</dt>
                  <dd>4 190 000 FCFA</dd>
                </div>
                <div>
                  <dt>Promesses en cours</dt>
                  <dd>02</dd>
                </div>
                <div>
                  <dt>Clients au carnet</dt>
                  <dd>12</dd>
                </div>
              </dl>
              <p className="carnet__caption">
                Chiffres de la démonstration, pas une moyenne du marché. Le
                carnet de Nana &amp; Fils est rempli pour que vous puissiez
                essayer sans saisir vos vraies données.
              </p>
            </aside>
          </div>
        </section>

        <section className="pourqui shell">
          <div className="section-head">
            <div>
              <span className="kicker">Pour qui</span>
              <h2>Ceux qui vendent à crédit, mais pas à perte.</h2>
            </div>
            <span className="section-head__aside">Douala et environs</span>
          </div>
          <ul className="pourqui__grid">
            {SECTORS.map((sector, index) => (
              <li className="pourqui__item" key={sector.name}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{sector.name}</h3>
                <p>{sector.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="pricing shell" id="prix">
          <div className="pricing__sheet">
            <div className="pricing__copy">
              <span className="kicker">Le prix</span>
              <h2>Le prix d’un carnet bien tenu.</h2>
              <p>
                Un abonnement pour le carnet. Un pourcentage sur les paiements
                en ligne. Pas de module à cocher, pas de devis surprise.
              </p>
              <ul className="pricing__list">
                <li>Le carnet complet, clients et créances</li>
                <li>Séquences SMS, WhatsApp et vocal</li>
                <li>Lien de paiement MTN MoMo et Orange Money</li>
                <li>Promesses, litiges et reçus numérotés</li>
                <li>Import du carnet existant</li>
              </ul>
            </div>
            <div className="pricing__figure">
              <span className="eyebrow">Formule Essentiel</span>
              <p className="pricing__number">
                35 000 <span>FCFA par mois, par commerce</span>
              </p>
              <p className="pricing__rate">
                <strong>3 %</strong> sur les paiements en ligne
                <small>
                  Prélevés sur l’encaissement. Aucun frais ajouté à votre
                  client.
                </small>
              </p>
              <Link href="/connexion" className="btn btn--paper">
                Ouvrir la démonstration
                <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
              </Link>
              <p className="pricing__fine">
                Cette démonstration ne prélève rien. Les envois et les paiements
                sont simulés pour vous laisser essayer le carnet.
              </p>
            </div>
          </div>
        </section>

        <section className="faq shell">
          <div className="faq__grid">
            <div className="faq__intro">
              <span className="kicker">Questions de comptoir</span>
              <h2>Ce qu’on nous demande souvent.</h2>
              <p>
                Par WhatsApp, au téléphone, ou autour d’un café à Mboppi. Voici
                les réponses courtes.
              </p>
            </div>
            <div className="faq__list">
              {QUESTIONS.map((item) => (
                <details className="faq__item" key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="closing">
          <div className="shell closing__grid">
            <div className="closing__copy">
              <span className="kicker kicker--light">Le carnet est ouvert</span>
              <h2>Votre argent n’a pas besoin d’attendre.</h2>
              <p>
                Entrez avec le compte de la Quincaillerie Nana &amp; Fils. Le
                carnet est déjà rempli : créances, relances, promesses, caisse.
                Vous pouvez tout essayer sans rien casser.
              </p>
            </div>
            <div className="closing__card">
              <span className="eyebrow">Compte de démonstration</span>
              <dl className="closing__credentials">
                <div>
                  <dt>Adresse</dt>
                  <dd>patron@nanafils.cm</dd>
                </div>
                <div>
                  <dt>Mot de passe</dt>
                  <dd>Palabre2026!</dd>
                </div>
              </dl>
              <Link href="/connexion" className="btn btn--paper btn--block">
                Entrer dans le carnet
                <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
              </Link>
              <p className="closing__fine">
                Aucun compte à créer. Aucune carte bancaire. Aucun client réel
                n’est contacté.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="shell site-footer__row">
          <div>
            <Wordmark compact />
            <p className="site-footer__note">
              Un produit de l’atelier CADC, Douala. Le carnet des commerces qui
              veulent être payés sans perdre la relation.
            </p>
          </div>
          <div className="site-footer__meta">
            <a href="#methode">La méthode</a>
            <a href="#prix">Le prix</a>
            <Link href="/connexion">Connexion</Link>
            <span>© {new Date().getFullYear()} CADC</span>
            <span>Édition de démonstration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
