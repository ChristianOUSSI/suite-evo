"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster } from "@/lib/client-api";

export function FormulaireConnexion({ plein }: { plein?: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState(plein ? "standard@iswouri.cm" : "");
  const [motDePasse, setMotDePasse] = useState(plein ? "Voix2026!" : "");
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function soumettre(event: React.FormEvent) {
    event.preventDefault();
    setEnCours(true);
    setPanne("");
    try {
      await poster("/auth/login", { email, password: motDePasse });
      router.push("/tableau");
      router.refresh();
    } catch (erreur) {
      setPanne(
        erreur instanceof ErreurApi
          ? erreur.message
          : "Le standard ne répond pas. Vérifiez l'API."
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form className="formulaire" onSubmit={soumettre}>
      <h1>Console du standard</h1>
      <p className="sous">
        Une séance par poste. Tout ce que la voix a tenu hier est là, heure par
        heure.
      </p>

      {panne && <div className="erreur">{panne}</div>}

      <label className="champ">
        <span>Email de l'établissement</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="champ">
        <span>Mot de passe</span>
        <input
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <button className="bouton" type="submit" disabled={enCours}>
        {enCours ? "Connexion…" : "Entrer"}
      </button>

      <p className="sortie">
        Démonstration : <code>standard@iswouri.cm</code> /{" "}
        <code>Voix2026!</code>. Aucun appel réel n'est passé.
      </p>
    </form>
  );
}
