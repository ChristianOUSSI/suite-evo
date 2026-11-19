"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { GENRES, MOYENS, STATUTS, VILLES } from "@/lib/constantes";
import type { Colis, ColisEntree, GenreColis, Moyen, StatutColis } from "@/lib/types";

type Props = { colis: Colis[]; langue: string };

const VIDE = {
  genre: "colis" as GenreColis,
  description: "",
  poids_kg: "",
  expediteur_nom: "",
  expediteur_telephone: "",
  destinataire_nom: "",
  destinataire_telephone: "",
  depart: "Douala",
  arrivee: "Yaoundé",
  frais: "",
  moyen: "a_payer" as Moyen,
  date_depot: "",
  note: "",
};

/**
 * Les colis du transporteur : une fiche par envoi, son numéro de suivi,
 * son trajet, ses frais, son statut. Le statut avance d'un geste -
 * reçu, en transit, arrivé, distribué, retourné, annulé - et la date
 * de livraison se pose toute seule.
 */
export function ColisGerant({ colis, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);
  const [recherche, setRecherche] = useState("");

  const affiches = recherche.trim()
    ? colis.filter((un) => {
        const motif = recherche.trim().toLowerCase();
        return (
          un.numero.toLowerCase().includes(motif) ||
          un.destinataire_nom.toLowerCase().includes(motif) ||
          un.expediteur_nom.toLowerCase().includes(motif) ||
          un.description.toLowerCase().includes(motif)
        );
      })
    : colis;

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: ColisEntree = {
        genre: form.genre,
        description: form.description,
        poids_kg: parseInt(form.poids_kg, 10) || 0,
        expediteur_nom: form.expediteur_nom,
        expediteur_telephone: form.expediteur_telephone ? `+237${form.expediteur_telephone}` : "",
        destinataire_nom: form.destinataire_nom,
        destinataire_telephone: form.destinataire_telephone ? `+237${form.destinataire_telephone}` : "",
        depart: form.depart,
        arrivee: form.arrivee,
        frais: parseInt(form.frais.replace(/\D/g, ""), 10) || 0,
        moyen: form.moyen,
        date_depot: form.date_depot || null,
        note: form.note,
      };
      await ecrire<Colis>("/colis", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Colis, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Colis>(`/colis/${un.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [un.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("colis.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.genre")}</span>
              <select value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value as GenreColis })}>
                {GENRES.map((un) => (
                  <option key={un} value={un}>{t(`genre.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.poids")}</span>
              <input value={form.poids_kg} onChange={(e) => setForm({ ...form, poids_kg: e.target.value.replace(/\D/g, "") })} inputMode="numeric" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("colis.description")}</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.expediteur")}</span>
              <input value={form.expediteur_nom} onChange={(e) => setForm({ ...form, expediteur_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.destinataire")}</span>
              <input value={form.destinataire_nom} onChange={(e) => setForm({ ...form, destinataire_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.depart")}</span>
              <select value={form.depart} onChange={(e) => setForm({ ...form, depart: e.target.value })}>
                {VILLES.map((un) => (
                  <option key={un} value={un}>{un}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.arrivee")}</span>
              <select value={form.arrivee} onChange={(e) => setForm({ ...form, arrivee: e.target.value })}>
                {VILLES.map((un) => (
                  <option key={un} value={un}>{un}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.frais")}</span>
              <input value={form.frais} onChange={(e) => setForm({ ...form, frais: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="15 000" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.moyen")}</span>
              <select value={form.moyen} onChange={(e) => setForm({ ...form, moyen: e.target.value as Moyen })}>
                {MOYENS.map((un) => (
                  <option key={un} value={un}>{t(`moyen.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.date_depot")}</span>
              <input type="date" value={form.date_depot} onChange={(e) => setForm({ ...form, date_depot: e.target.value })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("colis.note")}</span>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={300} autoComplete="off" />
            </label>
          </div>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("colis.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("colis.recherche")}</span>
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("colis.recherche-aide")}
          autoComplete="off"
        />
      </label>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li className={`cadc-ligne${un.statut === "distribue" ? " eleve--dette" : ""}${un.statut === "retourne" || un.statut === "annule" ? " ouvrier--sorti" : ""}`} key={un.id}>
            <span className="cadc-ligne__nom">
              {un.destinataire_nom || un.numero}
              <small>
                {un.numero} · {t(`genre.${un.genre}`)} · {un.depart} → {un.arrivee}
                {un.description ? ` · ${un.description}` : ""}
                {un.destinataire_telephone_display ? ` · ${un.destinataire_telephone_display}` : ""}
                {un.agent ? ` · ${un.agent}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(un.frais)}</strong>
              <br />
              <small>{t(`moyen.${un.moyen}`)}</small>
              <br />
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { statut: e.target.value as StatutColis })}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>{t(`statut.${s}`)}</option>
                ))}
              </select>
              <br />
              <small>
                {f.jourDate(un.date_depot)}
                {un.date_livraison ? ` → ${f.jourDate(un.date_livraison)}` : ""}
              </small>
              {erreurs[un.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[un.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
