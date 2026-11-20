"use client";

import { useEffect, useState } from "react";

import { PRODUITS, type Produit } from "@/lib/produits";

const TEXTES = {
  fr: {
    surtitre: "CODE AXIS DIGITAL CAMEROON",
    titre: "La maison des logiciels de comptoir",
    chapo:
      "Vingt-deux produits, un même socle : chaque métier a son logiciel, chaque logiciel tient sur un téléphone, en français comme en anglais, en FCFA.",
    compte: "produits",
    ouvrir: "Ouvrir",
    pied: "Chaque produit a sa propre adresse : les ports 3500 à 5700. En démo, rien ne quitte la machine - aucun SMS, aucun appel, aucune argent qui part.",
    vide: "aucun produit ne répond pour l'instant",
  },
  en: {
    surtitre: "CODE AXIS DIGITAL CAMEROON",
    titre: "The house of counter software",
    chapo:
      "Twenty-two products, one foundation: every trade has its software, every software fits on a phone, in French and English, in FCFA.",
    compte: "products",
    ouvrir: "Open",
    pied: "Every product has its own address: ports 3500 to 5700. In demo, nothing leaves the machine - no SMS, no call, no money leaves.",
    vide: "no product is answering yet",
  },
} as const;

type Langue = keyof typeof TEXTES;

function Carte({ produit, langue }: { produit: Produit; langue: Langue }) {
  const [joignable, setJoignable] = useState<"?" | "oui" | "non">("?");

  useEffect(() => {
    const controle = new AbortController();
    const minuteur = setTimeout(() => controle.abort(), 2500);
    // no-cors : on teste seulement que la porte répond, pas le contenu.
    fetch(`http://localhost:${produit.port}`, { method: "HEAD", mode: "no-cors", signal: controle.signal })
      .then(() => {
        clearTimeout(minuteur);
        setJoignable("oui");
      })
      .catch(() => {
        clearTimeout(minuteur);
        setJoignable("non");
      });
    return () => {
      clearTimeout(minuteur);
      controle.abort();
    };
  }, [produit.port]);

  const texte = produit[langue];
  return (
    <li>
      <a className="portail__carte" href={`http://localhost:${produit.port}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`http://localhost:${produit.port}/logo.jpg`}
          alt={produit.nom}
          className="portail__logo"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="portail__nom">{produit.nom}</span>
        <span className="portail__titre">{texte.titre}</span>
        <span className="portail__texte">{texte.texte}</span>
        <span className="portail__port">
          :{produit.port} ·{" "}
          {joignable === "oui"
            ? langue === "en"
              ? "open"
              : "ouvert"
            : joignable === "non"
              ? TEXTES[langue].vide
              : "--�"}
        </span>
      </a>
    </li>
  );
}

export default function Portail() {
  const [langue, setLangue] = useState<Langue>("fr");
  const t = TEXTES[langue];

  return (
    <div className="cadc-gabarit portail">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <span className="cadc-marque">
            <span className="cadc-marque__texte">
              <span className="cadc-marque__nom">suite-evo</span>
              <span className="cadc-marque__sous">CODE AXIS DIGITAL CAMEROON</span>
            </span>
          </span>
          <div className="cadc-acts" role="group" aria-label="Langue / Language">
            <button
              type="button"
              className={`cadc-bouton cadc-bouton--petit ${langue === "fr" ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
              onClick={() => setLangue("fr")}
              aria-pressed={langue === "fr"}
            >
              FR
            </button>
            <button
              type="button"
              className={`cadc-bouton cadc-bouton--petit ${langue === "en" ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
              onClick={() => setLangue("en")}
              aria-pressed={langue === "en"}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <section className="portail__hero">
        <span className="cadc-badge cadc-badge--acier">{t.surtitre}</span>
        <h1>{t.titre}</h1>
        <p className="portail__chapo">{t.chapo}</p>
        <p className="portail__compte">
          <span className="cadc-badge cadc-badge--doux">
            {PRODUITS.length} {t.compte}
          </span>
        </p>
      </section>

      <ul className="portail__liste">
        {PRODUITS.map((produit) => (
          <Carte key={produit.nom} produit={produit} langue={langue} />
        ))}
      </ul>

      <p className="portail__pied">{t.pied}</p>

      <footer className="cadc-pied">
        <div className="cadc-gabarit cadc-pied__rangee">
          <span>CODE AXIS DIGITAL CAMEROON · Douala</span>
        </div>
      </footer>
    </div>
  );
}
