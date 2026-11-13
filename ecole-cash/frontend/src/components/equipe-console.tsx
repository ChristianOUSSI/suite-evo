"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "@/components/icone";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { initiales } from "@/lib/format";
import type { Membre, MembreEntree } from "@/lib/types";

const ROLE = [
  {
    cle: "directrice" as const,
    label: "Directrice",
    texte: "Voit tout, règle l'école, engage les années.",
  },
  {
    cle: "comptable" as const,
    label: "Comptable",
    texte: "Tient le guichet et la caisse du jour.",
  },
  {
    cle: "surveillante" as const,
    label: "Surveillante",
    texte: "Lit les listes, marque les présences, n'encaisse pas.",
  },
];

const VIDE: MembreEntree = {
  nom: "",
  email: "",
  mot_de_passe: "",
  role: "comptable",
};

export function EquipeConsole({ membres }: { membres: Membre[] }) {
  const routeur = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [champ, setChamp] = useState<MembreEntree>(VIDE);
  const [message, setMessage] = useState<string | null>(null);
  const [incident, setIncident] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const motCourt = champ.mot_de_passe.length > 0 && champ.mot_de_passe.length < 6;

  async function inscrire(event: React.FormEvent) {
    event.preventDefault();
    if (champ.nom.trim().length < 2 || champ.email.trim() === "" || motCourt) {
      setIncident(
        motCourt
          ? "Six caractères au minimum pour le mot de passe."
          : "Le nom, l'adresse et le mot de passe sont nécessaires.",
      );
      return;
    }
    setEnCours(true);
    setMessage(null);
    setIncident(null);
    try {
      const cree = await ecrire<Membre>("/team", { method: "POST", body: champ });
      setMessage(`${cree.nom} tient une caisse sous ${cree.role_label}.`);
      setChamp(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (erreur) {
      setIncident(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : "Le registre n'a pas accepté ce nom.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="equipe">
      <div className="section-head">
        <h2>Qui tient la caisse</h2>
        <span className="section-head__aside">
          {membres.length} membre{membres.length > 1 ? "s" : ""}
        </span>
      </div>

      <ul className="equipe__liste">
        {membres.map((membre) => (
          <li className="equipe__ligne" key={membre.id}>
            <span className="avatar" aria-hidden="true">
              {initiales(membre.nom)}
            </span>
            <span className="equipe__texte">
              {membre.nom}
              <small className="mono">{membre.email}</small>
            </span>
            <span className="tag tag--quiet">{membre.role_label}</span>
          </li>
        ))}
      </ul>

      {message ? (
        <p className="notice notice--success" role="status">
          {message}
        </p>
      ) : null}
      {incident ? (
        <p className="notice notice--error" role="alert">
          {incident}
        </p>
      ) : null}

      {ouvert ? (
        <form className="equipe__form" onSubmit={inscrire}>
          <div className="field">
            <label htmlFor="membre-nom">Nom</label>
            <input
              id="membre-nom"
              value={champ.nom}
              onChange={(event) =>
                setChamp((actuel) => ({ ...actuel, nom: event.target.value }))
              }
              maxLength={120}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="membre-email">Adresse électronique</label>
            <input
              id="membre-email"
              type="email"
              autoComplete="off"
              value={champ.email}
              onChange={(event) =>
                setChamp((actuel) => ({ ...actuel, email: event.target.value }))
              }
              maxLength={160}
              required
            />
            <span className="field__aide">
              Elle sert seule de connexion. Une adresse, une caisse.
            </span>
          </div>
          <div className="field">
            <label htmlFor="membre-mot">Mot de passe</label>
            <input
              id="membre-mot"
              type="password"
              autoComplete="new-password"
              value={champ.mot_de_passe}
              onChange={(event) =>
                setChamp((actuel) => ({ ...actuel, mot_de_passe: event.target.value }))
              }
              minLength={6}
              maxLength={120}
              required
              aria-invalid={motCourt || undefined}
            />
            {motCourt ? (
              <span className="field__aide field__aide--tard">
                Six caractères au minimum.
              </span>
            ) : null}
          </div>
          <div className="field">
            <span className="field__label">Rôle</span>
            <div className="roles">
              {ROLE.map((un) => (
                <label
                  className={`role${champ.role === un.cle ? " role--choisi" : ""}`}
                  key={un.cle}
                >
                  <input
                    type="radio"
                    name="role-membre"
                    value={un.cle}
                    checked={champ.role === un.cle}
                    onChange={() =>
                      setChamp((actuel) => ({ ...actuel, role: un.cle }))
                    }
                  />
                  <span className="role__marque" aria-hidden="true" />
                  <span className="role__texte">
                    <strong>{un.label}</strong>
                    <small>{un.texte}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--ink" disabled={enCours}>
              {enCours ? "Inscription" : "Inscrire ce membre"}
              <span className="btn__fleche" aria-hidden="true">
                <Icone nom="eleve" taille={15} />
              </span>
            </button>
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => {
                setOuvert(false);
                setIncident(null);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn--small"
          onClick={() => {
            setOuvert(true);
            setIncident(null);
          }}
        >
          Ajouter une main au guichet
        </button>
      )}

      <p className="vide-note">
        Le mot de passe oublié se règle pour l&apos;instant au bureau de
        l&apos;agence : la réinitialisation par SMS n&apos;est pas encore
        branchée. Notez le mot de passe sur une fiche, dans le tiroir de la
        caisse.
      </p>
    </div>
  );
}
