"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster, supprimer } from "@/lib/client-api";
import type { Fermeture } from "@/lib/types";

function demain(): string {
  const jour = new Date();
  jour.setDate(jour.getDate() + 1);
  return jour.toISOString().slice(0, 10);
}

export function Fermetures({ fermetures }: { fermetures: Fermeture[] }) {
  const route = useRouter();
  const [debut, setDebut] = useState(demain());
  const [fin, setFin] = useState(demain());
  const [motif, setMotif] = useState("");
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function ajouter() {
    setEnCours(true);
    setPanne("");
    try {
      await poster<Fermeture>("/closures", {
        starts: debut,
        ends: fin,
        reason: motif.trim(),
      });
      setMotif("");
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function retirer(id: number) {
    setEnCours(true);
    setPanne("");
    try {
      await supprimer(`/closures/${id}`);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau">
      <h2>Les jours où rien ne décroche</h2>

      {fermetures.length === 0 && (
        <p className="vide">
          Aucune fermeture notée. Rentrées, fêtes et coupures d'électricité
          prévues se déclarent ici, sinon le standard répond à l'attendu.
        </p>
      )}

      <div className="fermetures">
        {fermetures.map((fermeture) => (
          <div key={fermeture.id} className="fermeture">
            <span className="plage">{fermeture.period}</span>
            <span className="motif">{fermeture.reason}</span>
            <button
              type="button"
              className="bouton sobre petit"
              disabled={enCours}
              onClick={() => retirer(fermeture.id)}
            >
              Rouvrir
            </button>
          </div>
        ))}
      </div>

      <p className="sous">Une absence de plus</p>
      <div className="trois-champs">
        <label className="champ-ligne">
          <span>Premier jour</span>
          <input
            type="date"
            value={debut}
            onChange={(e) => setDebut(e.target.value)}
          />
        </label>
        <label className="champ-ligne">
          <span>Dernier jour</span>
          <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
        </label>
        <label className="champ-ligne">
          <span>Pourquoi</span>
          <input
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            placeholder="rentrée décalée"
          />
        </label>
      </div>

      {fin < debut && (
        <p className="attention">Le dernier jour ne peut pas précéder le premier.</p>
      )}
      {panne && <p className="message-erreur">{panne}</p>}

      <div className="ligne-action">
        <button
          className="bouton"
          type="button"
          onClick={ajouter}
          disabled={
            enCours || motif.trim().length < 2 || fin < debut || debut === ""
          }
        >
          Fermer ces jours
        </button>
      </div>

      <p className="note-bas">
        Deux fermetures qui se recouvrent sont refusées : la voix ne saurait pas
        quelle date donner comme reprise.
      </p>
    </section>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Les fermetures n'ont pas répondu. Vérifiez que l'API tourne.";
}
