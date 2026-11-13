"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Channel = "sms" | "whatsapp" | "vocal";
type Tone = "courtois" | "ferme";

const CHANNELS: {
  id: Channel;
  label: string;
  step: string;
}[] = [
  { id: "sms", label: "SMS", step: "J+7" },
  { id: "whatsapp", label: "WhatsApp", step: "J+3" },
  { id: "vocal", label: "Vocal", step: "J+14" },
];

const MESSAGES: Record<Channel, Record<Tone, string>> = {
  whatsapp: {
    courtois:
      "Bonjour Mme Adèle Tchoumi, nous n'avons pas encore reçu le règlement de la facture PAL-2026-0005 (95 000 FCFA). Un contretemps ? Répondez à ce message, on trouve une date ensemble.",
    ferme:
      "La facture PAL-2026-0005 (95 000 FCFA) est échue depuis 12 jours. Merci de régler ou de nous donner une date avant demain.",
  },
  sms: {
    courtois:
      "Bonjour Mme Adèle Tchoumi, il reste 95 000 FCFA sur la facture PAL-2026-0005, en retard de 12 jours. Le lien ci-dessous clôt le dossier : palabre.cm/payer/9f2c. Répondez STOP pour arrêter les SMS.",
    ferme:
      "Facture PAL-2026-0005 : 95 000 FCFA impayés, 12 jours de retard. Réglez maintenant : palabre.cm/payer/9f2c. Répondez STOP pour arrêter les SMS.",
  },
  vocal: {
    courtois:
      "Bonjour, ici le service des comptes de la Quincaillerie Nana et Fils. Nous appelons au sujet de la facture PAL-2026-0005, dont le solde est de 95 000 francs CFA, en retard de 12 jours. Pour trouver une solution simplement, rappelez le +237 6 99 14 22 08. Merci.",
    ferme:
      "Bonjour, ici le service des comptes de la Quincaillerie Nana et Fils. La facture PAL-2026-0005 présente un solde de 95 000 francs CFA, en retard de 12 jours. Il s'agit de notre dernier rappel amiable. Merci de rappeler le +237 6 99 14 22 08 pour convenir d'un règlement.",
  },
};

const SIGNATURE = "Quincaillerie Nana & Fils, service des comptes, Mboppi";
const WAVE = [7, 14, 10, 22, 17, 28, 13, 24, 9, 19, 26, 12, 21, 8, 16, 11];

function subscribeToVoices() {
  return () => {};
}

export function MessagePreview() {
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [tone, setTone] = useState<Tone>("courtois");
  const [speaking, setSpeaking] = useState(false);
  const voiceReady = useSyncExternalStore(
    subscribeToVoices,
    () => "speechSynthesis" in window,
    () => false,
  );

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const text = MESSAGES[channel][tone];
  const meta = CHANNELS.find((item) => item.id === channel);

  function listen() {
    if (!voiceReady) {
      return;
    }
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(`${text} ${SIGNATURE}`);
    utterance.lang = "fr-FR";
    utterance.rate = 0.92;
    utterance.pitch = 0.98;
    const frenchVoice = synth
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("fr"));
    if (frenchVoice) {
      utterance.voice = frenchVoice;
    }
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(utterance);
    setSpeaking(true);
  }

  return (
    <div className="preview">
      <div className="preview__toolbar">
        <div className="channel-tabs" aria-label="Choisir le canal">
          {CHANNELS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="channel-tab"
              aria-pressed={channel === item.id}
              onClick={() => {
                setChannel(item.id);
                window.speechSynthesis?.cancel();
                setSpeaking(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="tone-switch">
          <span className="tone-switch__label">Ton</span>
          {(["courtois", "ferme"] as Tone[]).map((item) => (
            <button
              key={item}
              type="button"
              className="tone-switch__button"
              aria-pressed={tone === item}
              onClick={() => setTone(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="preview__sheet">
        <div className="preview__head">
          <span>
            {channel === "vocal" ? "APPEL VOCAL" : "MESSAGE"} · {meta?.step}
          </span>
          <span>09:14</span>
        </div>

        {channel === "vocal" && (
          <div className="wave" aria-hidden="true">
            {WAVE.map((height, index) => (
              <span
                key={index}
                className="wave__bar"
                style={{ height: `${height}px` }}
              />
            ))}
          </div>
        )}

        <p className="preview__message" aria-live="polite">
          {text}
        </p>
        <span className="preview__sig">
          {channel === "vocal"
            ? "Script lu par une voix locale, jamais pressée."
            : "Quincaillerie Nana & Fils · Service des comptes, Mboppi"}
        </span>
      </div>

      <div className="preview__foot">
        <span>Exemple bâti sur le carnet de démonstration.</span>
        {voiceReady && (
          <button
            type="button"
            className="listen-button"
            onClick={listen}
          >
            {speaking ? "Arrêter la lecture" : "Écouter l'aperçu"}
          </button>
        )}
      </div>
    </div>
  );
}
