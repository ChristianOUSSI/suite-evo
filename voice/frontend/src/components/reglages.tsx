"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dictee } from "@/components/dictee";
import { ErreurApi, poster, remplacer } from "@/lib/client-api";
import { fcfa } from "@/lib/format";
import type { Apercu, Ligne, Organisation } from "@/lib/types";

const GENRES = [
  { code: "universite", label: "Université" },
  { code: "ecole", label: "École" },
  { code: "clinique", label: "Clinique" },
  { code: "agence", label: "Agence" },
];

const TONS = [
  { code: "chaleureux", label: "Chaleureux" },
  { code: "sobre", label: "Sobre" },
  { code: "institutionnel", label: "Institutionnel" },
];

const LANGUES = [
  { code: "fr", label: "Français seulement" },
  { code: "en", label: "Anglais seulement" },
  { code: "bilingue", label: "Les deux : la voix propose la touche 9" },
];

type Boleen =
  | "sms_enabled"
  | "whatsapp_enabled"
  | "voice_enabled"
  | "auto_reminders"
  | "daily_log"
  | "discretion";

interface Champs {
  name: string;
  kind: string;
  city: string;
  quartier: string;
  main_line: string;
  agent_name: string;
  greeting: string;
  greeting_en: string;
  language: string;
  tone: string;
  callback_minutes: number;
  sms_price: number;
  discretion: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  voice_enabled: boolean;
  auto_reminders: boolean;
  daily_log: boolean;
}

const CANAUX: { cle: Boleen; label: string; tient: string }[] = [
  {
    cle: "sms_enabled",
    label: "SMS",
    tient: "confirmations de place et accusés de message",
  },
  {
    cle: "whatsapp_enabled",
    label: "WhatsApp",
    tient: "les rappels de la veille, quand le numéro y est",
  },
  {
    cle: "voice_enabled",
    label: "Appel vocal",
    tient: "la voix qui rappelle, plus longue à tenir mais mieux passée",
  },
];

function champsDe(org: Organisation): Champs {
  return {
    name: org.name,
    kind: org.kind,
    city: org.city,
    quartier: org.quartier,
    main_line: org.main_line,
    agent_name: org.agent_name,
    greeting: org.greeting,
    greeting_en: org.greeting_en,
    language: org.language,
    tone: org.tone,
    callback_minutes: org.callback_minutes,
    sms_price: org.sms_price,
    discretion: org.discretion,
    sms_enabled: org.sms_enabled,
    whatsapp_enabled: org.whatsapp_enabled,
    voice_enabled: org.voice_enabled,
    auto_reminders: org.auto_reminders,
    daily_log: org.daily_log,
  };
}

export function Reglages({
  organisation,
  lignes,
  compte,
}: {
  organisation: Organisation;
  lignes: Ligne[];
  compte: Record<string, number>;
}) {
  const route = useRouter();
  const [champs, setChamps] = useState<Champs>(() => champsDe(organisation));
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [panne, setPanne] = useState("");
  const [dit, setDit] = useState("");
  const [enCours, setEnCours] = useState(false);

  function regler(cle: keyof Champs, valeur: string | number | boolean) {
    setChamps((actuel) => ({ ...actuel, [cle]: valeur }) as Champs);
  }

  async function voir() {
    setEnCours(true);
    setPanne("");
    try {
      setApercu(await poster<Apercu>("/settings/preview", {}));
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  async function enregistrer() {
    setEnCours(true);
    setPanne("");
    setDit("");
    try {
      const ecrit = await remplacer<Organisation>("/settings", {
        ...champs,
        name: champs.name.trim(),
        city: champs.city.trim(),
        quartier: champs.quartier.trim(),
        main_line: champs.main_line.trim(),
        agent_name: champs.agent_name.trim(),
        greeting: champs.greeting.trim(),
        greeting_en: champs.greeting_en.trim(),
      });
      setChamps(champsDe(ecrit));
      setApercu(await poster<Apercu>("/settings/preview", {}));
      setDit("Tenus. La voix parlera avec ces mots dès le prochain appel.");
      route.refresh();
    } catch (erreur) {
      setPanne(texte(erreur));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="reglages-voisins">
      <section className="panneau">
        <h2>La maison</h2>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Nom tel qu'on le dit au téléphone</span>
            <input
              value={champs.name}
              onChange={(e) => regler("name", e.target.value)}
            />
          </label>
          <label className="champ-ligne">
            <span>Genre d'établissement</span>
            <select
              value={champs.kind}
              onChange={(e) => regler("kind", e.target.value)}
            >
              {GENRES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Ville</span>
            <input
              value={champs.city}
              onChange={(e) => regler("city", e.target.value)}
            />
          </label>
          <label className="champ-ligne">
            <span>Quartier</span>
            <input
              value={champs.quartier}
              onChange={(e) => regler("quartier", e.target.value)}
            />
          </label>
        </div>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Ligne principale</span>
            <input
              value={champs.main_line}
              onChange={(e) => regler("main_line", e.target.value)}
              placeholder="233 42 55 18"
            />
          </label>
          <label className="champ-ligne">
            <span>Prénom de la voix</span>
            <input
              value={champs.agent_name}
              onChange={(e) => regler("agent_name", e.target.value)}
            />
          </label>
        </div>

        <label className="champ-ligne">
          <span>La salutation, telle qu'elle est dite</span>
          <textarea
            value={champs.greeting}
            onChange={(e) => regler("greeting", e.target.value)}
            placeholder="Vide : la voix compose elle-même, avec le prénom réglé plus haut."
          />
        </label>

        <label className="champ-ligne">
          <span>La salutation en anglais, pour les appels du Sud-Ouest</span>
          <textarea
            value={champs.greeting_en}
            onChange={(e) => regler("greeting_en", e.target.value)}
            placeholder="Empty: the voice builds it from the name and the desk."
          />
        </label>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Les langues que la voix tient</span>
            <select
              value={champs.language}
              onChange={(e) => regler("language", e.target.value)}
            >
              {LANGUES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="champ-ligne">
            <span>Prix du segment SMS (FCFA)</span>
            <input
              type="number"
              min={0}
              max={50}
              step={1}
              value={champs.sms_price}
              onChange={(e) => regler("sms_price", Number(e.target.value))}
            />
          </label>
        </div>

        <div className="deux-champs">
          <label className="champ-ligne">
            <span>Ton</span>
            <select
              value={champs.tone}
              onChange={(e) => regler("tone", e.target.value)}
            >
              {TONS.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="champ-ligne">
            <span>Fenêtre de rappel (minutes)</span>
            <input
              type="number"
              min={15}
              max={720}
              step={15}
              value={champs.callback_minutes}
              onChange={(e) => regler("callback_minutes", Number(e.target.value))}
            />
          </label>
        </div>

        <p className="sous">Ce qui est ouvert</p>
        <div className="canals">
          {CANAUX.map((canal) => (
            <label key={canal.cle} className="canal">
              <input
                type="checkbox"
                checked={champs[canal.cle]}
                onChange={(e) => regler(canal.cle, e.target.checked)}
              />
              <b>{canal.label}</b>
              <span>{canal.tient}</span>
            </label>
          ))}

          <label className="canal">
            <input
              type="checkbox"
              checked={champs.auto_reminders}
              onChange={(e) => regler("auto_reminders", e.target.checked)}
            />
            <b>Rappels de la veille</b>
            <span>
              Fermé, la tournée ne se lance que depuis la page Envois, à la main.
            </span>
          </label>
          <label className="canal">
            <input
              type="checkbox"
              checked={champs.daily_log}
              onChange={(e) => regler("daily_log", e.target.checked)}
            />
            <b>Passage du matin</b>
            <span>
              Ouvert, charger le tableau fait partir les rappels dus et les
              envois programmés.
            </span>
          </label>
          <label className="canal">
            <input
              type="checkbox"
              checked={champs.discretion}
              onChange={(e) => regler("discretion", e.target.checked)}
            />
            <b>Discrétion</b>
            <span>
              Ouverte, la voix ne dit jamais qui se trouve dans l'établissement :
              elle transmet au poste, sans prénom ni bureau.
            </span>
          </label>
        </div>

        <p className="facture">
          Formule {organisation.plan} : {fcfa(organisation.monthly_fee)} par mois.
          En Démo, aucun prélèvement n'est réglé et rien n'est facturé.
        </p>

        {panne && <p className="message-erreur">{panne}</p>}
        {dit && <p className="message-erreur ok">{dit}</p>}

        <div className="ligne-action">
          <button
            className="bouton"
            type="button"
            onClick={enregistrer}
            disabled={enCours || champs.name.trim().length < 2}
          >
            Enregistrer l'établissement
          </button>
          <button
            className="bouton sobre"
            type="button"
            onClick={() => {
              setChamps(champsDe(organisation));
              setDit("");
            }}
          >
            Revenir aux mots d'avant
          </button>
        </div>
      </section>

      <div className="colonne">
        <section className="panneau">
          <h2>Ce que la voix dira</h2>
          <p className="chapeau">
            La salutation prise telle quelle, poste par poste, à l'heure où
            l'établissement décroche.
          </p>
          <button
            className="bouton sobre"
            type="button"
            onClick={voir}
            disabled={enCours}
          >
            Entendre la salutation
          </button>
          {apercu && (
            <div className="apercu">
              <Dictee lignes={[apercu.first]} />
              {apercu.others.map((ligne) => (
                <Dictee lignes={[ligne]} key={ligne} />
              ))}
              {apercu.bilingual && (
                <>
                  <p className="sous">Touche 9, la même phrase en anglais</p>
                  <Dictee lignes={[apercu.english]} />
                </>
              )}
              {apercu.line && <p className="detail">Premier poste : {apercu.line}.</p>}
            </div>
          )}
        </section>

        <section className="panneau">
          <h2>Ce que la console a déjà tenu</h2>
          <dl className="compte">
            <div>
              <dt>Appels tracés</dt>
              <dd>{compte.calls ?? 0}</dd>
            </div>
            <div>
              <dt>Fiches du répertoire</dt>
              <dd>{compte.answers ?? 0}</dd>
            </div>
            <div>
              <dt>Mots à rendre</dt>
              <dd>{compte.messages ?? 0}</dd>
            </div>
            <div>
              <dt>Places posées</dt>
              <dd>{compte.appointments ?? 0}</dd>
            </div>
          </dl>

          <p className="sous">Les numéros décrochés</p>
          <div className="numerotes">
            {lignes.map((ligne) => (
              <p key={ligne.id}>
                <b>{ligne.label}</b>
                <span className="detail">{ligne.number_display || "sans numéro"}</span>
                <span className={ligne.answered_by_human ? "ouvert" : "ferme"}>
                  {ligne.answered_by_human ? "personne possible" : "voix seule"}
                </span>
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function texte(erreur: unknown): string {
  return erreur instanceof ErreurApi
    ? erreur.message
    : "Les réglages n'ont pas répondu. Vérifiez que l'API tourne.";
}
