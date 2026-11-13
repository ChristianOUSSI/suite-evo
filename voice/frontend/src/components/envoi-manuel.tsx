"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErreurApi, poster } from "@/lib/client-api";
import type { Envoi, Organisation } from "@/lib/types";

const CANAUX = [
  { code: "sms", label: "SMS", cle: "sms_enabled" as const },
  { code: "whatsapp", label: "WhatsApp", cle: "whatsapp_enabled" as const },
  {
    code: "appel_vocal",
    label: "Appel vocal",
    cle: "voice_enabled" as const,
  },
];

export function EnvoiManuel({ organisation }: { organisation: Organisation }) {
  const route = useRouter();
  const [canal, setCanal] = useState("sms");
  const [telephone, setTelephone] = useState("");
  const [sujet, setSujet] = useState("");
  const [corps, setCorps] = useState("");
  const [panne, setPanne] = useState("");
  const [parti, setParti] = useState<Envoi | null>(null);
  const [enCours, setEnCours] = useState(false);

  const tient = telephone.trim() !== "" && corps.trim().length >= 3;

  async function envoyer() {
    setEnCours(true);
    setPanne("");
    try {
      const envoi = await poster<Envoi>("/dispatches", {
        channel: canal,
        to_phone: telephone.trim(),
        subject: sujet.trim(),
        body: corps.trim(),
      });
      setParti(envoi);
      route.refresh();
    } catch (erreur) {
      setPanne(
        erreur instanceof ErreurApi
          ? erreur.message
          : "La console n'a pas accepté l'envoi."
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="panneau">
      <h2>Écrire un envoi à la main</h2>
      <p className="chapeau">
        Le même chemin que les confirmations automatiques, mais c'est vous qui
        écrivez. La trace garde sa référence dans le journal, à côté des autres.
      </p>

      <label className="champ-ligne">
        <span>Canal</span>
        <select value={canal} onChange={(e) => setCanal(e.target.value)}>
          {CANAUX.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
              {organisation[item.cle] ? "" : " (coupé dans les réglages)"}
            </option>
          ))}
        </select>
      </label>

      <div className="deux-champs">
        <label className="champ-ligne">
          <span>Numéro du destinataire</span>
          <input
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="6 55 12 08 33"
          />
        </label>
        <label className="champ-ligne">
          <span>Rappel du sujet</span>
          <input
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="déplacement du bureau"
          />
        </label>
      </div>

      <label className="champ-ligne">
        <span>Le texte, trois cents signes au plus</span>
        <textarea
          value={corps}
          maxLength={480}
          onChange={(e) => setCorps(e.target.value)}
          placeholder="Le bureau de la scolarité ferme à midi ce jeudi."
        />
      </label>
      <p className="comptage">
        {corps.length} / 480
        {corps.trim() ? ` · ${Math.ceil(corps.length / 153)} SMS à la caisse` : ""}
      </p>

      {panne && <p className="message-erreur">{panne}</p>}
      {parti && (
        <p
          className={
            parti.status === "envoye"
              ? "message-erreur ok"
              : "message-erreur"
          }
        >
          {parti.reference} : {parti.status === "envoye"
            ? `inscrit au journal, ${parti.channel_label} vers ${parti.to_phone_display} (Démo).`
            : `canal refusé, rien n'a été tenté.`}
        </p>
      )}

      <div className="ligne-action">
        <button
          className="bouton"
          type="button"
          onClick={envoyer}
          disabled={enCours || !tient}
        >
          Pousser vers le téléphone
        </button>
        <button
          className="bouton sobre"
          type="button"
          onClick={() => {
            setTelephone("");
            setSujet("");
            setCorps("");
            setParti(null);
          }}
        >
          Effacer le texte
        </button>
      </div>
    </section>
  );
}
