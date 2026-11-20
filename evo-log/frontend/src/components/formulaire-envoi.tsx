"use client";

import { useState } from "react";

import { GENRES, VILLES } from "@/lib/constantes";
import { traduire } from "@/lib/langue";
import type { DemandeEnvoiEntree } from "@/lib/types";

type Props = { langue: string };

const CHEMIN = "/api/public/envois";

const VIDE: DemandeEnvoiEntree = {
  genre: "colis",
  description: "",
  poids_kg: 0,
  expediteur_nom: "",
  expediteur_telephone: "",
  destinataire_nom: "",
  destinataire_telephone: "",
  depart: "Douala",
  arrivee: "Douala",
  note: "",
};

/**
 * La demande d'envoi publique : l'expéditeur écrit sans compte.
 * L'agence voit la demande dans /demandes et tranche.
 */
export function FormulaireEnvoi({ langue }: Props) {
  const t = traduire(langue).t;
  const [form, setForm] = useState<DemandeEnvoiEntree>(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enCours, setEnCours] = useState(false);

  function pose<K extends keyof DemandeEnvoiEntree>(cle: K, valeur: DemandeEnvoiEntree[K]) {
    setForm((avant) => ({ ...avant, [cle]: valeur }));
  }

  async function envoyer(evenement: React.FormEvent) {
    evenement.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const reponse = await fetch(CHEMIN, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await reponse.json().catch(() => null);
      if (!reponse.ok) {
        const detail = (payload as { detail?: unknown })?.detail;
        const texte =
          detail && typeof detail === "object"
            ? ((detail as { fr?: string; en?: string })[langue === "en" ? "en" : "fr"] ??
              (detail as { fr?: string }).fr ??
              "")
            : typeof detail === "string"
              ? detail
              : "";
        throw new Error(
          texte ||
            (langue === "en"
              ? "The agency did not accept this request."
              : "L'agence n'a pas accepté cette demande."),
        );
      }
      setOk(true);
      setForm(VIDE);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (ok) {
    return (
      <section className="cadc-carte">
        <p style={{ fontWeight: 600 }}>{t("envoi.ok")}</p>
      </section>
    );
  }

  return (
    <section className="cadc-carte">
      <form onSubmit={envoyer} className="cadc-pile">
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.genre")}</span>
            <select value={form.genre} onChange={(e) => pose("genre", e.target.value)}>
              {GENRES.map((un) => (
                <option key={un} value={un}>
                  {t(`genre.${un}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.poids")}</span>
            <input
              type="number"
              min={0}
              max={5000}
              value={form.poids_kg}
              onChange={(e) => pose("poids_kg", Number(e.target.value) || 0)}
            />
          </label>
        </div>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("envoi.description")}</span>
          <input maxLength={2000} value={form.description} onChange={(e) => pose("description", e.target.value)} />
        </label>
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.expediteur")}</span>
            <input
              required
              maxLength={160}
              value={form.expediteur_nom}
              onChange={(e) => pose("expediteur_nom", e.target.value)}
            />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.telephone")}</span>
            <input
              required
              type="tel"
              inputMode="tel"
              maxLength={24}
              placeholder="690 12 34 56"
              value={form.expediteur_telephone}
              onChange={(e) => pose("expediteur_telephone", e.target.value)}
            />
          </label>
        </div>
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.destinataire")}</span>
            <input
              required
              maxLength={160}
              value={form.destinataire_nom}
              onChange={(e) => pose("destinataire_nom", e.target.value)}
            />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.telephone")}</span>
            <input
              required
              type="tel"
              inputMode="tel"
              maxLength={24}
              placeholder="677 44 55 66"
              value={form.destinataire_telephone}
              onChange={(e) => pose("destinataire_telephone", e.target.value)}
            />
          </label>
        </div>
        <div className="cadc-2col">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.depart")}</span>
            <select value={form.depart} onChange={(e) => pose("depart", e.target.value)}>
              {VILLES.map((un) => (
                <option key={un} value={un}>
                  {un}
                </option>
              ))}
            </select>
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("envoi.arrivee")}</span>
            <select value={form.arrivee} onChange={(e) => pose("arrivee", e.target.value)}>
              {VILLES.map((un) => (
                <option key={un} value={un}>
                  {un}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("envoi.note")}</span>
          <textarea maxLength={600} rows={3} value={form.note} onChange={(e) => pose("note", e.target.value)} />
        </label>
        {erreur ? <p className="cadc-erreur">{erreur}</p> : null}
        <div className="cadc-acts">
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours}>
            {enCours ? "…" : t("envoi.envoyer")}
          </button>
        </div>
      </form>
    </section>
  );
}
