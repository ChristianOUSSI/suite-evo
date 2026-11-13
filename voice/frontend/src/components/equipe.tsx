"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster } from "@/lib/client-api";
import type { Membre } from "@/lib/types";

export function Equipe({
  equipe,
  moi,
}: {
  equipe: Membre[];
  moi: string;
}) {
  const route = useRouter();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [role, setRole] = useState("standardiste");
  const [panne, setPanne] = useState("");
  const [dit, setDit] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function ajouter() {
    setEnCours(true);
    setPanne("");
    setDit("");
    try {
      const membre = await poster<Membre>("/team", {
        name: nom.trim(),
        email: email.trim(),
        password: motDePasse,
        role,
      });
      setDit(`${membre.name} a accès à la console sous ${membre.email}.`);
      setNom("");
      setEmail("");
      setMotDePasse("");
      route.refresh();
    } catch (erreur) {
      setPanne(
        erreur instanceof ErreurApi
          ? erreur.message
          : "La console n'a pas ajouté ce conseiller."
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau">
      <h2>Qui tient la console</h2>

      <div className="equipe">
        {equipe.map((membre) => (
          <div key={membre.id} className={membre.name === moi ? "tenu moi" : "tenu"}>
            <b>{membre.name}</b>
            <span className="detail">{membre.email}</span>
            <span className="role">{membre.role}</span>
            {membre.name === moi && <span className="detail">c'est vous</span>}
          </div>
        ))}
      </div>

      <p className="sous">Une main de plus</p>
      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Nom affiché</span>
          <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Arlette Njoya" />
        </label>
        <label className="champ-ligne">
          <span>Email de connexion</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="arlette@etablissement.cm"
          />
        </label>
      </div>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Mot de passe de départ</span>
          <input
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            placeholder="vide : Voix2026!"
          />
        </label>
        <label className="champ-ligne">
          <span>Rôle</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="standardiste">Standardiste</option>
            <option value="responsable">Responsable</option>
          </select>
        </label>
      </div>

      {panne && <p className="message-erreur">{panne}</p>}
      {dit && <p className="message-erreur ok">{dit}</p>}

      <div className="ligne-action">
        <button
          className="bouton mousse"
          type="button"
          onClick={ajouter}
          disabled={
            enCours || nom.trim().length < 2 || !email.trim().includes("@")
          }
        >
          Ajouter à l'équipe
        </button>
      </div>
      <p className="note-bas">
        En Démo, ce mot de passe ne protège rien qui sorte de la machine : un
        compte de plus ouvre seulement les mêmes fiches, à un poste de plus.
      </p>
    </section>
  );
}
