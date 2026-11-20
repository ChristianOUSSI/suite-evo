"use client";

import { useEffect, useMemo, useState } from "react";

import { PRODUITS, type Produit } from "@/lib/produits";

const TEXTES = {
  fr: {
    surtitre: "CODE AXIS DIGITAL CAMEROON",
    titre: "La maison des logiciels de comptoir",
    chapo:
      "Chaque métier a son logiciel. Chaque logiciel tient sur un téléphone, en français comme en anglais, en FCFA, avec Mobile Money.",
    compte: "produits",
    chercher: "Chercher un produit…",
    ouvrir: "Ouvrir",
    statutOuvert: "ouvert",
    statutFerme: "fermé",
    statutTest: "test…",
    pied: "Chaque produit a sa propre adresse. En démo, rien ne quitte la machine : aucun SMS, aucun appel, aucune argent qui part.",
    vide: "aucun produit ne répond pour l'instant",
    aucunTrouve: "Aucun produit ne correspond à ta recherche.",
  },
  en: {
    surtitre: "CODE AXIS DIGITAL CAMEROON",
    titre: "The house of counter software",
    chapo:
      "Every trade has its software. Every software fits on a phone, in French and English, in FCFA, with Mobile Money.",
    compte: "products",
    chercher: "Search a product…",
    ouvrir: "Open",
    statutOuvert: "open",
    statutFerme: "closed",
    statutTest: "testing…",
    pied: "Every product has its own address. In demo, nothing leaves the machine: no SMS, no call, no money leaves.",
    vide: "no product is answering yet",
    aucunTrouve: "No product matches your search.",
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`http://localhost:${produit.port}/logo.jpg`}
          alt={produit.nom}
          className="portail__logo"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
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
          <span className="portail__ouvrir">{t.ouvrir} →</span>
        </span>
      </a>
    </li>
  );
}

export default function Portail() {
  const [langue, setLangue] = useState<Langue>("fr");
  const [recherche, setRecherche] = useState("");
  const t = TEXTES[langue];

  const filtres = useMemo(() => {
    const mot = recherche.trim().toLowerCase();
    if (!mot) return PRODUITS;
    return PRODUITS.filter((p) => {
      const texte = `${p.nom} ${p[langue].titre} ${p[langue].texte}`.toLowerCase();
      return texte.includes(mot);
    });
  }, [recherche, langue]);

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

      <div className="portail__recherche">
        <input
          type="search"
          className="portail__champ"
          placeholder={t.chercher}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          aria-label={t.chercher}
        />
      </div>

      {filtres.length === 0 ? (
        <p className="portail__vide">{t.aucunTrouve}</p>
      ) : (
        <ul className="portail__liste">
          {filtres.map((produit) => (
            <Carte key={produit.nom} produit={produit} langue={langue} />
          ))}
        </ul>
      )}

      <p className="portail__pied">{t.pied}</p>

      <footer className="cadc-pied">
        <div className="cadc-gabarit cadc-pied__rangee">
          <span>CODE AXIS DIGITAL CAMEROON · Douala</span>
        </div>
      </footer>
    </div>
  );
}
