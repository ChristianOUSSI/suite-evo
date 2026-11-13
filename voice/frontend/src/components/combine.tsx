"use client";

import { useState } from "react";
import { Dictee } from "@/components/dictee";
import { ErreurApi, parametres, poster } from "@/lib/client-api";
import { heure } from "@/lib/format";
import type { Bilan, Guichet, Ligne, Ouverture } from "@/lib/types";

interface Trace {
  titre: string;
  lignes: string[];
  bilan?: Bilan;
}

const ACTIONS_COURTES: Record<string, string> = {
  reponse: "réponse",
  rendezvous: "rendez-vous",
  message: "message",
  transfert: "transfert",
};

export function Combine({
  lignes,
  guichets,
  agent,
}: {
  lignes: Ligne[];
  guichets: Guichet[];
  agent: string;
}) {
  const [poste, setPoste] = useState(String(lignes[0]?.id ?? ""));
  const [moment, setMoment] = useState("");
  const [numero, setNumero] = useState("6 77 08 41 96");
  const [nom, setNom] = useState("Nadège Ekwa");
  const [mot, setMot] = useState("");
  const [question, setQuestion] = useState("");
  const [urgence, setUrgence] = useState("simple");
  const [traces, setTraces] = useState<Trace[]>([]);
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  const choisie = lignes.find((ligne) => String(ligne.id) === poste);
  const entrees = choisie?.menu ?? [];

  function horaire(): string | undefined {
    return moment ? new Date(moment).toISOString() : undefined;
  }

  async function dcrocher() {
    setEnCours(true);
    setPanne("");
    try {
      const data = await poster<Ouverture>(
        `/standard/ouvrir${parametres({ line_id: poste, at: horaire() })}`,
        {}
      );
      setTraces((actuel) => [
        ...actuel,
        { titre: "Le poste décroche", lignes: data.script },
      ]);
    } catch (erreur) {
      setPanne(message(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function appuyer(digit: string, rendezVous?: string) {
    setEnCours(true);
    setPanne("");
    try {
      const bilan = await poster<Bilan>("/standard/appeler", {
        line_id: Number(poste),
        caller_phone: numero,
        caller_name: nom,
        at: horaire(),
        digit,
        question,
        message_body: mot,
        urgency: urgence,
        appointment_start: rendezVous,
      });
      setTraces((actuel) => [
        ...actuel,
        {
          titre: rendezVous
            ? `Place posée ${heure(rendezVous)}`
            : `Touche ${digit} pressée`,
          lignes: bilan.script,
          bilan,
        },
      ]);
      setQuestion("");
      setMot("");
    } catch (erreur) {
      setPanne(message(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function parler() {
    setEnCours(true);
    setPanne("");
    try {
      const bilan = await poster<Bilan>("/standard/appeler", {
        line_id: Number(poste),
        caller_phone: numero,
        caller_name: nom,
        at: horaire(),
        question,
        message_body: mot,
        urgency: urgence,
      });
      setTraces((actuel) => [
        ...actuel,
        { titre: `« ${question} »`, lignes: bilan.script, bilan },
      ]);
      setQuestion("");
    } catch (erreur) {
      setPanne(message(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="panneaux">
      <div className="panneau">
        <h2>Le combiné</h2>

        <label className="champ-ligne">
          <span>Poste appelé</span>
          <select value={poste} onChange={(e) => setPoste(e.target.value)}>
            {lignes.map((ligne) => (
              <option key={ligne.id} value={String(ligne.id)}>
                {ligne.label} ({ligne.number_display})
              </option>
            ))}
          </select>
        </label>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Qui appelle</span>
            <input value={numero} onChange={(e) => setNumero(e.target.value)} />
          </label>
          <label className="champ-ligne">
            <span>Nom donné</span>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="peut rester vide"
            />
          </label>
        </div>

        <label className="champ-ligne">
          <span>Instant de l'appel (vide = maintenant)</span>
          <input
            type="datetime-local"
            value={moment}
            onChange={(e) => setMoment(e.target.value)}
          />
        </label>

        <p className="detail" style={{ margin: "16px 0 8px" }}>
          Touches réglées sur ce poste
        </p>
        <div className="touche-menu">
          {entrees.map((entree) => (
            <button
              type="button"
              onClick={() => appuyer(entree.digit)}
              disabled={enCours}
              key={entree.id}
            >
              <span className="doigt">{entree.digit}</span>
              <span>{entree.label}</span>
              <span className="action">
                {ACTIONS_COURTES[entree.action] ?? entree.action}
              </span>
            </button>
          ))}
          {entrees.length === 0 && (
            <p className="vide">Aucune touche sur ce poste pour l'instant.</p>
          )}
        </div>

        <label className="champ-ligne" style={{ marginTop: 16 }}>
          <span>Ce que l'appelant dit, sans toucher de touche</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Vous prenez le dossier à quelle heure ?"
          />
        </label>

        <div className="ligne-action">
          <button className="bouton" type="button" onClick={dcrocher} disabled={enCours}>
            Décrocher
          </button>
          <button
            className="bouton mousse"
            type="button"
            onClick={parler}
            disabled={enCours || !question.trim()}
          >
            Laisser parler
          </button>
          <button
            className="bouton sobre"
            type="button"
            onClick={() => setTraces([])}
          >
            Effacer le carnet
          </button>
        </div>

        {panne && <p className="message-erreur">{panne}</p>}

        <label className="champ-ligne" style={{ marginTop: 18 }}>
          <span>Mot laissé sur la messagerie</span>
          <textarea
            value={mot}
            onChange={(e) => setMot(e.target.value)}
            placeholder="Prévenez la scolarité que je passe jeudi."
          />
        </label>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Urgence</span>
            <select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
              <option value="simple">Simple</option>
              <option value="note">À noter</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="champ-ligne">
            <span>Agent au standard</span>
            <input value={agent} readOnly />
          </label>
        </div>
      </div>

      <div className="panneau">
        <h2>Ce que la voix a dit</h2>
        {traces.length === 0 && (
          <p className="vide">
            Décrochez, ou appuyez sur une touche du menu. Chaque essai écrit une
            vraie fiche dans le journal.
          </p>
        )}
        {traces.map((trace, index) => (
          <div key={index} style={{ marginBottom: 22 }}>
            <p className="detail">{trace.titre}</p>
            <Dictee lignes={trace.lignes} />
            {trace.bilan?.slots.length ? (
              <div className="creneaux" style={{ marginTop: 10 }}>
                {trace.bilan.slots.map((place) => (
                  <button
                    className="creneau"
                    type="button"
                    key={place}
                    onClick={() =>
                      appuyer(
                        entrees.find((e) => e.action === "rendezvous")?.digit ??
                          "4",
                        place
                      )
                    }
                  >
                    {heure(place)}
                  </button>
                ))}
              </div>
            ) : null}
            {trace.bilan?.appointment_id ? (
              <p className="message-erreur ok">
                Rendez-vous {trace.bilan.appointment_id} posé, confirmation
                envoyée en Démo.
              </p>
            ) : null}
          </div>
        ))}
        {guichets.length > 0 && (
          <p className="note" style={{ marginTop: 18 }}>
            Guichets ouverts : {guichets.map((g) => g.name).join(", ")}.
          </p>
        )}
      </div>
    </div>
  );
}

function message(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Le standard ne répond pas. Vérifiez que l'API tourne.";
}
