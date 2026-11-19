"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ecrire } from "@/lib/client-api";
import { ErreurPresence } from "@/lib/errors";
import { traduire } from "@/lib/langue";
import type { Connexion } from "@/lib/types";

const COMPTES = [
  {
    cle: "responsable",
    nom: { fr: "Responsable", en: "Manager" },
    aide: {
      fr: "la maison, les fiches d'employés, les comptes",
      en: "the company, the staff cards, the accounts",
    },
    email: "ada@horizon.cm",
    mot: "Presence2026!",
  },
  {
    cle: "agent",
    nom: { fr: "Agent", en: "Agent" },
    aide: {
      fr: "le pointage du matin, rien d'autre",
      en: "the morning roll, nothing else",
    },
    email: "mbarga@horizon.cm",
    mot: "Presence2026!",
  },
];

export function FormulaireSeance({ langue }: { langue: string }) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [email, setEmail] = useState(COMPTES[0].email);
  const [mot, setMot] = useState(COMPTES[0].mot);
  const [tord, setTord] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ouvrir(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setTord(null);
    try {
      await ecrire<Connexion>("/auth/login", {
        body: { email, mot_de_passe: mot },
        langue,
      });
      routeur.push("/pointage");
      routeur.refresh();
    } catch (erreur) {
      setTord(
        erreur instanceof ErreurPresence
          ? erreur.message
          : langue === "en"
            ? "The session did not open."
            : "La séance ne s'est pas ouverte.",
      );
      setEnCours(false);
    }
  }

  return (
    <form className="cadc-carte cadc-pile" onSubmit={ouvrir}>
      <div className="cadc-champ">
        <label htmlFor="email">{t("seance.adresse")}</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="cadc-champ">
        <label htmlFor="mot">{t("seance.mot")}</label>
        <input
          id="mot"
          type="password"
          autoComplete="current-password"
          value={mot}
          onChange={(e) => setMot(e.target.value)}
          required
        />
      </div>

      <div className="cadc-champ">
        <span className="cadc-champ__titre">{t("seance.comptes")}</span>
        <div className="cadc-pile cadc-pile--serree">
          {COMPTES.map((compte) => (
            <button
              type="button"
              key={compte.cle}
              className="cadc-onglet"
              style={{ textAlign: "left", whiteSpace: "normal" }}
              onClick={() => {
                setEmail(compte.email);
                setMot(compte.mot);
              }}
            >
              {compte.nom[langue === "en" ? "en" : "fr"]} · {compte.email}
              <small style={{ display: "block", fontWeight: 400, opacity: 0.75 }}>
                {compte.aide[langue === "en" ? "en" : "fr"]}
              </small>
            </button>
          ))}
        </div>
        <span className="cadc-champ__aide">{t("seance.aide")}</span>
      </div>

      {tord ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          {tord}
        </p>
      ) : null}

      <button
        type="submit"
        className="cadc-bouton cadc-bouton--grand cadc-bouton--premier"
        disabled={enCours}
      >
        {enCours ? t("seance.ouverture") : t("seance.ouvrir")}
      </button>

      <p className="cadc-demo">{t("commun.dejaDemo")}</p>
    </form>
  );
}
