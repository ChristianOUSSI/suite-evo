"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, patcher, supprimer } from "@/lib/client-api";
import { URGENCES } from "@/lib/format";
import type { Message } from "@/lib/types";

const ETAT: Record<string, string> = {
  nouveau: "pastille ambre",
  en_cours: "pastille",
  rappelle: "pastille mousse",
};

const COULEUR_URGENCE: Record<string, string> = {
  simple: "pastille",
  note: "pastille ambre",
  urgent: "pastille rouille",
};

function libelleUrgence(code: string): string {
  return URGENCES.find((item) => item.code === code)?.label ?? code;
}

export function Courant({
  messages,
  agent,
}: {
  messages: Message[];
  agent: string;
}) {
  const route = useRouter();
  const [edition, setEdition] = useState(0);
  const [par, setPar] = useState(agent);
  const [mot, setMot] = useState("");
  const [panne, setPanne] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function changer(
    id: number,
    corps: { status?: string; handled_by?: string; handled_note?: string }
  ) {
    setEnCours(true);
    setPanne("");
    try {
      await patcher<Message>(`/messages/${id}`, corps);
      setEdition(0);
      setMot("");
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function effacer(id: number) {
    setEnCours(true);
    setPanne("");
    try {
      await supprimer(`/messages/${id}`);
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  if (messages.length === 0) {
    return (
      <section className="panneau">
        <h2>La file</h2>
        <p className="vide">
          Rien à tenir sur cette fenêtre. La file se remplit toute seule quand
          la voix décroche hors des heures ouvertes.
        </p>
        {panne && <p className="message-erreur">{panne}</p>}
      </section>
    );
  }

  return (
    <section className="panneau">
      <h2>La file</h2>
      <div className="mots">
        {messages.map((message) => (
          <article
            key={message.id}
            className={message.overdue ? "mot depasse" : "mot"}
          >
            <header className="entete-mot">
              <b className="qui">{message.from_name || "appelant sans nom"}</b>
              <span className="tel">{message.from_phone_display}</span>
              <span className={ETAT[message.status] ?? "pastille"}>
                {message.status_label}
              </span>
              {message.urgency !== "simple" && (
                <span className={COULEUR_URGENCE[message.urgency]}>
                  {libelleUrgence(message.urgency)}
                </span>
              )}
              <span className="poste">{message.line_label}</span>
            </header>

            <p className="quoi">{message.body}</p>

            <p className="promesse">
              promis {message.promised_label}, noté {message.created_label}
              {message.overdue && <b className="retard"> dépasse la promesse</b>}
            </p>

            {(message.handled_by || message.handled_note) && (
              <p className="tenu">
                {message.handled_by || "tenu par"}
                {message.handled_note ? `: ${message.handled_note}` : ""}
                {message.recalled_at ? ", rappelé" : ""}
              </p>
            )}

            {edition === message.id ? (
              <div className="tenue-finale">
                <label className="champ-ligne">
                  <span>Qui a rappelé</span>
                  <input
                    value={par}
                    onChange={(e) => setPar(e.target.value)}
                  />
                </label>
                <label className="champ-ligne">
                  <span>Ce qu'on note en face</span>
                  <input
                    value={mot}
                    onChange={(e) => setMot(e.target.value)}
                    placeholder="rappelé, rendez-vous pris pour jeudi"
                  />
                </label>
                <div className="ligne-action">
                  <button
                    className="bouton mousse petit"
                    type="button"
                    disabled={enCours}
                    onClick={() =>
                      changer(message.id, {
                        status: "rappelle",
                        handled_by: par.trim(),
                        handled_note: mot.trim(),
                      })
                    }
                  >
                    C'est rappelé
                  </button>
                  <button
                    className="bouton sobre petit"
                    type="button"
                    onClick={() => setEdition(0)}
                  >
                    Annuler la saisie
                  </button>
                </div>
              </div>
            ) : (
              <div className="actions-mot">
                {message.status === "nouveau" && (
                  <button
                    className="bouton sobre petit"
                    type="button"
                    disabled={enCours}
                    onClick={() => changer(message.id, { status: "en_cours" })}
                  >
                    Je m'en saisis
                  </button>
                )}
                {message.status !== "rappelle" && (
                  <button
                    className="bouton petit"
                    type="button"
                    disabled={enCours}
                    onClick={() => {
                      setEdition(message.id);
                      setPar(agent);
                      setMot("");
                    }}
                  >
                    Marquer rappelé
                  </button>
                )}
                {message.status === "rappelle" && (
                  <button
                    className="bouton sobre petit"
                    type="button"
                    disabled={enCours}
                    onClick={() => changer(message.id, { status: "nouveau" })}
                  >
                    Rouvrir le mot
                  </button>
                )}
                <button
                  className="bouton sobre petit"
                  type="button"
                  disabled={enCours}
                  onClick={() => effacer(message.id)}
                >
                  Effacer de la main courante
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {panne && <p className="message-erreur">{panne}</p>}
      <p className="pager">
        {messages.length} mots sur la fenêtre demandée. La file se tri par heure
        de promesse, la plus ancienne en haut.
      </p>
    </section>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "La main courante n'a pas répondu. Vérifiez que l'API tourne.";
}
