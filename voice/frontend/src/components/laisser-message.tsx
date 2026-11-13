"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster } from "@/lib/client-api";
import type { Message } from "@/lib/types";

export function Laisser({
  postes,
  defaut,
}: {
  postes: { id: number; label: string }[];
  defaut: number;
}) {
  const route = useRouter();
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [poste, setPoste] = useState(String(postes[0]?.id ?? ""));
  const [urgence, setUrgence] = useState("simple");
  const [texte, setTexte] = useState("");
  const [minutes, setMinutes] = useState(defaut);
  const [instant, setInstant] = useState("");
  const [panne, setPanne] = useState("");
  const [pose, setPose] = useState<Message | null>(null);
  const [enCours, setEnCours] = useState(false);

  const tient = nom.trim().length >= 2 && telephone.trim() !== "" && texte.trim().length >= 4;

  async function noter() {
    setEnCours(true);
    setPanne("");
    try {
      const mot = await poster<Message>("/messages", {
        from_name: nom.trim(),
        from_phone: telephone.trim(),
        body: texte.trim(),
        urgency: urgence,
        line_id: poste ? Number(poste) : null,
        promised_at: instant ? new Date(instant).toISOString() : null,
        promised_in_minutes: instant || !minutes ? null : minutes,
      });
      setPose(mot);
      setTexte("");
      setInstant("");
      route.refresh();
    } catch (erreur) {
      setPanne(
        erreur instanceof ErreurApi
          ? erreur.message
          : "La main courante n'a pas répondu."
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau">
      <h2>Noter un mot à la main</h2>
      <p className="chapeau">
        Quand quelqu'un tombe sur le standard et laisse un message sans passer
        par la voix, on l'écrit ici. La même fenêtre de rappel s'applique.
      </p>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Qui a appelé</span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Clarisse Mbarga"
          />
        </label>
        <label className="champ-ligne">
          <span>Son numéro</span>
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="6 77 08 41 96"
          />
        </label>
      </div>

      <label className="champ-ligne">
        <span>Ce qu'il faut lui rendre</span>
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Demander si le dossier de mutation est prêt avant vendredi."
        />
      </label>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Poste appelé</span>
          <select value={poste} onChange={(e) => setPoste(e.target.value)}>
            {postes.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="champ-ligne">
          <span>Degré d'urgence</span>
          <select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
            <option value="simple">Simple</option>
            <option value="note">À noter</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Fenêtre de rappel (minutes)</span>
          <input
            type="number"
            min={15}
            max={1440}
            step={15}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <label className="champ-ligne">
          <span>Ou une heure précise</span>
          <input
            type="datetime-local"
            value={instant}
            onChange={(e) => setInstant(e.target.value)}
          />
        </label>
      </div>

      {panne && <p className="message-erreur">{panne}</p>}
      {pose && (
        <p className="message-erreur ok">
          Mot noté, promesse {pose.promised_label}. L'accusé de réception est
          parti vers {pose.from_phone_display} en Démo.
        </p>
      )}
      {!tient && (
        <p className="attention">
          Il faut un nom, un numéro et quelques mots à rendre.
        </p>
      )}

      <div className="ligne-action">
        <button
          className="bouton"
          type="button"
          onClick={noter}
          disabled={enCours || !tient}
        >
          Écrire dans la main courante
        </button>
        <button
          className="bouton sobre"
          type="button"
          onClick={() => {
            setNom("");
            setTelephone("");
            setTexte("");
            setPose(null);
          }}
        >
          Repartir de zéro
        </button>
      </div>
    </section>
  );
}
