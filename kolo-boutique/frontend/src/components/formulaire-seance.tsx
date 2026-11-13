"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "./icone";
import { ecrire } from "@/lib/client-api";
import { ErreurComptoir } from "@/lib/errors";
import type { Connexion } from "@/lib/types";

const COMPTES = [
  {
    role: "Tenancière",
    email: "tenanciere@tchuentecahier.cm",
    mot: "Kolodo2026!",
  },
  {
    role: "Vendeuse",
    email: "vendeuse@tchuentecahier.cm",
    mot: "Kolodo2026!",
  },
];

export function FormulaireSeance() {
  const routeur = useRouter();
  const [email, setEmail] = useState(COMPTES[0].email);
  const [mot, setMot] = useState(COMPTES[0].mot);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ouvrir(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setIncident(null);
    try {
      await ecrire<Connexion>("/auth/login", {
        body: { email, mot_de_passe: mot },
      });
      routeur.push("/comptoir");
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurComptoir
          ? erreur.message
          : "La séance ne s'est pas ouverte.",
      );
      setEnCours(false);
    }
  }

  return (
    <form className="feuille bloc seance__form" onSubmit={ouvrir}>
      <div className="pile-champs">
        <div className="champ">
          <label htmlFor="email">Adresse du comptoir</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="mot">Mot de passe</label>
          <input
            id="mot"
            type="password"
            autoComplete="current-password"
            value={mot}
            onChange={(e) => setMot(e.target.value)}
            required
          />
        </div>

        <div className="champ">
          <span className="champ__titre">Deux mains de la même boutique</span>
          <div className="comptes-demo">
            {COMPTES.map((compte) => (
              <button
                type="button"
                key={compte.email}
                className="comptes-demo__bouton"
                onClick={() => {
                  setEmail(compte.email);
                  setMot(compte.mot);
                }}
              >
                <span className="comptes-demo__role">{compte.role}</span>
                <span className="comptes-demo__adresse mono">{compte.email}</span>
              </button>
            ))}
          </div>
          <span className="champ__aide">
            Un clic remplit les deux champs. La séance dure douze heures et
            tient dans un cookie que le téléphone ne voit jamais.
          </span>
        </div>

        {incident ? (
          <p className="note-bas note-bas--tard" role="alert">
            {incident}
          </p>
        ) : null}

        <div className="acts">
          <button type="submit" className="bouton bouton--encre" disabled={enCours}>
            {enCours ? "Ouverture" : "Ouvrir le comptoir"}
            <span className="bouton__fleche">
              <Icone nom="fleche" taille={15} />
            </span>
          </button>
        </div>

        <p className="mention-demo">
          <Icone nom="alerte" taille={13} />
          Démo : ces deux comptes ouvrent une boutique inventée, sans écriture
          hors de la machine.
        </p>
      </div>
    </form>
  );
}
