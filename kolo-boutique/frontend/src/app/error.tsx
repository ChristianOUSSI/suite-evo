"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icone } from "@/components/icone";
import { langueDepuisCookie, t, type Langue } from "@/lib/langue";

// Aucune borne n’affiche le message technique : un digest ou une erreur
// compressée de React ne dit rien à un tenancier. Le détail part dans la console.
export default function Incident({ reset }: { reset: () => void }) {
  const [langue, setLangue] = useState<Langue>("fr");
  useEffect(() => setLangue(langueDepuisCookie()), []);

  return (
    <div className="gabarit incident">
      <span className="sur-titre">
        <Icone nom="alerte" taille={13} /> {t("erreur.lecture", langue)}
      </span>
      <h1 className="display">{t("erreur.titre", langue)}</h1>
      <p>{t("erreur.texte", langue)}</p>
      <div className="acts">
        <button type="button" className="bouton bouton--encre" onClick={reset}>
          {t("erreur.repasser", langue)}
          <span className="bouton__fleche">
            <Icone nom="fleche" taille={15} />
          </span>
        </button>
        <Link href="/" className="lien-simple">
          {t("erreur.retour", langue)}
        </Link>
      </div>
    </div>
  );
}
