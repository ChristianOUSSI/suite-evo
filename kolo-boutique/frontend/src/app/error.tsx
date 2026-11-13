"use client";

import Link from "next/link";

import { Icone } from "@/components/icone";

// Aucune borne n’affiche le message technique : un digest ou une erreur
// compressée de React ne dit rien à un tenancier. Le détail part dans la console.
export default function Incident({ reset }: { reset: () => void }) {
  return (
    <div className="gabarit incident">
      <span className="sur-titre">
        <Icone nom="alerte" taille={13} /> Lecture impossible
      </span>
      <h1 className="display">Cette feuille n’a pas pu se poser.</h1>
      <p>
        Le cahier du comptoir n’a pas rendu cette page. Vérifie que l’API tourne
        sur le port attendu, puis repasse. Les écritures déjà consignées tiennent
        dans la base.
      </p>
      <div className="acts">
        <button type="button" className="bouton bouton--encre" onClick={reset}>
          Repasser
          <span className="bouton__fleche">
            <Icone nom="fleche" taille={15} />
          </span>
        </button>
        <Link href="/" className="lien-simple">
          Retour à la présentation
        </Link>
      </div>
    </div>
  );
}
