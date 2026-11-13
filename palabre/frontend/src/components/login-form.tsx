"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { apiCall } from "@/lib/client-api";
import { Fleche } from "@/components/fleche";

const DEMO_EMAIL = "patron@nanafils.cm";
const DEMO_PASSWORD = "Palabre2026!";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiCall("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      router.push("/app");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "L’ouverture du carnet a échoué.",
      );
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="email">Adresse électronique</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Mot de passe</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
        />
      </div>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="btn btn--stamp btn--block"
        disabled={busy}
      >
        {busy ? "Ouverture du carnet" : "Ouvrir le carnet"}
        <span className="btn__arrow" aria-hidden="true">
              <Fleche />
            </span>
      </button>
      <p className="login-form__note">
        Les champs sont préremplis pour la démonstration. Le mot de passe
        n’ouvre que le carnet fictif de Nana &amp; Fils.
      </p>
    </form>
  );
}
