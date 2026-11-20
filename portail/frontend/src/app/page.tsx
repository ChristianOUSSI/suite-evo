"use client";

import { useEffect, useMemo, useState } from "react";

import { PRODUITS, type Produit } from "@/lib/produits";

const TEXTES = {
  fr: {
    nav: { produits: "Produits", tarifs: "Tarifs", docs: "Documentation", support: "Support" },
    boutons: { connecter: "Se connecter", demarrer: "Démarrer maintenant" },
    hero: {
      titre: "Une idée. 30 produits qui évoluent.",
      sous: "La suite d'applications professionnelles de CADC. Conçue pour les entreprises camerounaises. Scalable, sécurisée, et interconnectée.",
      badge1: "30 PRODUITS",
      badge2: "99.9% UPTIME",
      badge3: "CAMEROUN",
      legende1: "Services disponibles",
      legende2: "Fiabilité & Sécurité",
      legende3: "Hébergé localement. Conforme",
    },
    filtre: { tous: "Tous les produits", tri: "Tri: Populaires", maj: "Mise à jour Nov 2026" },
    pied: "Chaque produit a sa propre adresse. En démo, rien ne quitte la machine : aucun SMS, aucun appel, aucune argent qui part.",
    statutOuvert: "ouvert",
    statutFerme: "fermé",
    statutTest: "test…",
  },
  en: {
    nav: { produits: "Products", tarifs: "Pricing", docs: "Documentation", support: "Support" },
    boutons: { connecter: "Sign in", demarrer: "Get started" },
    hero: {
      titre: "One idea. 30 evolving products.",
      sous: "The CADC professional application suite. Designed for Cameroonian businesses. Scalable, secure, and interconnected.",
      badge1: "30 PRODUCTS",
      badge2: "99.9% UPTIME",
      badge3: "CAMEROON",
      legende1: "Available services",
      legende2: "Reliability & Security",
      legende3: "Hosted locally. Compliant",
    },
    filtre: { tous: "All products", tri: "Sort: Popular", maj: "Updated Nov 2026" },
    pied: "Every product has its own address. In demo, nothing leaves the machine: no SMS, no call, no money leaves.",
    statutOuvert: "open",
    statutFerme: "closed",
    statutTest: "testing…",
  },
} as const;

type Langue = keyof typeof TEXTES;
type Joignable = "?" | "oui" | "non";

function useJoignable(port: number): Joignable {
  const [etat, setEtat] = useState<Joignable>("?");
  useEffect(() => {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), 2500);
    fetch(`http://localhost:${port}`, { method: "HEAD", mode: "no-cors", signal: controle.signal })
      .then(() => {
        clearTimeout(minuteur);
        setEtat("oui");
      })
      .catch(() => {
        clearTimeout(minuteur);
        setEtat("non");
      });
    return () => {
      clearTimeout(minuteur);
      controle.abort();
    };
  }, [port]);
  return etat;
}

function Carte({ produit, langue }: { produit: Produit; langue: Langue }) {
  const joignable = useJoignable(produit.port);
  const texte = produit[langue];
  const t = TEXTES[langue];

  const statut =
    joignable === "oui"
      ? { libelle: t.statutOuvert, classe: "portail__pastille--vert" }
      : joignable === "non"
        ? { libelle: t.statutFerme, classe: "portail__pastille--gris" }
        : { libelle: t.statutTest, classe: "portail__pastille--pulse" };

  return (
    <li>
      <a className="portail__carte" href={`http://localhost:${produit.port}`}>
        <span className="portail__haut">
          <span className="portail__nom">{produit.nom}</span>
          <span className={`portail__pastille ${statut.classe}`}>
            <span className="portail__pastille-point" />
            {statut.libelle}
          </span>
        </span>
        <span className="portail__titre">{texte.titre}</span>
        <span className="portail__texte">{texte.texte}</span>
        <span className="portail__pied-carte">
          <span className="portail__port">:{produit.port}</span>
          <span className="portail__ouvrir">→</span>
        </span>
      </a>
    </li>
  );
}

export default function Portail() {
  const [langue, setLangue] = useState<Langue>("fr");
  const t = TEXTES[langue];

  return (
    <div className="portail">
      <header className="portail__bandeau">
        <div className="portail__rangee">
          <div className="portail__logo">
            <span className="portail__logo-nom">CODE AXIS DIGITAL CAMEROON</span>
            <span className="portail__logo-sous">EVO SUITE</span>
          </div>
          <nav className="portail__nav">
            <a href="#produits">{t.nav.produits}</a>
            <a href="#tarifs">{t.nav.tarifs}</a>
            <a href="#docs">{t.nav.docs}</a>
            <a href="#support">{t.nav.support}</a>
          </nav>
          <div className="portail__actions">
            <button type="button" className="portail__bouton portail__bouton--doux">
              {t.boutons.connecter}
            </button>
            <button type="button" className="portail__bouton portail__bouton--premier">
              {t.boutons.demarrer}
            </button>
          </div>
        </div>
      </header>

      <section className="portail__hero">
        <div className="portail__hero-contenu">
          <h1>{t.hero.titre}</h1>
          <p className="portail__hero-sous">{t.hero.sous}</p>
          <div className="portail__badges">
            <div className="portail__badge">
              <span className="portail__badge-valeur">{t.hero.badge1}</span>
              <span className="portail__badge-legende">{t.hero.legende1}</span>
            </div>
            <div className="portail__badge">
              <span className="portail__badge-valeur">{t.hero.badge2}</span>
              <span className="portail__badge-legende">{t.hero.legende2}</span>
            </div>
            <div className="portail__badge">
              <span className="portail__badge-valeur">{t.hero.badge3}</span>
              <span className="portail__badge-legende">{t.hero.legende3}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="produits" className="portail__produits">
        <div className="portail__entete">
          <h2>Suite EVO - {PRODUITS.length} produits</h2>
          <div className="portail__filtres">
            <span className="portail__filtre">{t.filtre.tous}</span>
            <span className="portail__filtre">{t.filtre.tri}</span>
            <span className="portail__filtre">{t.filtre.maj}</span>
          </div>
        </div>
        <ul className="portail__liste">
          {PRODUITS.map((produit) => (
            <Carte key={produit.nom} produit={produit} langue={langue} />
          ))}
        </ul>
      </section>

      <p className="portail__pied">{t.pied}</p>

      <footer className="portail__footer">
        <div className="portail__rangee">
          <span>CODE AXIS DIGITAL CAMEROON · Douala</span>
          <div className="portail__langues">
            <button
              type="button"
              className={langue === "fr" ? "portail__langue--actif" : ""}
              onClick={() => setLangue("fr")}
            >
              FR
            </button>
            <button
              type="button"
              className={langue === "en" ? "portail__langue--actif" : ""}
              onClick={() => setLangue("en")}
            >
              EN
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
