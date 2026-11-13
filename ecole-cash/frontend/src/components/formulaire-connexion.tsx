"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import type { Connexion } from "@/lib/types";

const DEMO = [
  { email: "direction@tilleuls.cm", role: "Directrice" },
  { email: "caisse@tilleuls.cm", role: "Comptable" },
];

const MOT_DE_PASSE_DEMO = "Caisse2026!";

export function FormulaireConnexion() {
  const routeur = useRouter();
  const [email, setEmail] = useState(DEMO[1].email);
  const [motDePasse, setMotDePasse] = useState(MOT_DE_PASSE_DEMO);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: React.FormEvent) {
    event.preventDefault();
    setEnCours(true);
    setMessage(null);
    try {
      await ecrire<Connexion>("/auth/login", {
        method: "POST",
        body: { email, password: motDePasse },
      });
      routeur.push("/app");
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : "La caisse ne répond pas.",
      );
      setEnCours(false);
    }
  }

  return (
    <form className="sheet sheet--offset bloc" onSubmit={soumettre}>
      <div className="form-stack">
        {message ? (
          <p className="notice notice--error" role="alert">
            {message}
          </p>
        ) : null}

        <div className="field">
          <label htmlFor="email">Adresse de la caisse</label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="username"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="mdp">Mot de passe</label>
          <input
            id="mdp"
            type="password"
            value={motDePasse}
            autoComplete="current-password"
            onChange={(e) => setMotDePasse(e.target.value)}
            required
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn--ink btn--block"
            disabled={enCours}
          >
            {enCours ? "Ouverture…" : "Ouvrir la caisse"}
          </button>
        </div>

        <MentionDemo texte="Démo : les deux comptes ci-dessous ouvrent un groupe scolaire fictif. Aucun parent n'est contacté." />

        <ul className="comptes-demo">
          {DEMO.map((compte) => (
            <li key={compte.email}>
              <button
                type="button"
                className="comptes-demo__bouton"
                onClick={() => {
                  setEmail(compte.email);
                  setMotDePasse(MOT_DE_PASSE_DEMO);
                }}
              >
                <span className="comptes-demo__role">{compte.role}</span>
                <span className="mono">{compte.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}
