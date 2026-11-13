"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { MOTIFS, SENS, STATUTS } from "@/lib/constantes";
import type { Appel, AppelEntree, Compte } from "@/lib/types";

type Props = { appels: Appel[]; comptes: Compte[]; langue: string };

const VIDE = {
  client_nom: "",
  client_telephone: "",
  sens: "entrant",
  motif: "autre",
  duree_secondes: 0,
  date: "",
  date_rappel: "",
  note: "",
};

/**
 * Les appels du standard : une fiche par appel — le client, le sens, le
 * motif, la durée. Le statut se change d'un geste ; la file se lit
 * d'un coup d'œil, rien ne s'efface.
 */
export function AppelsGerant({ appels, comptes, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("");

  const affiches = appels.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.client_nom.toLowerCase().includes(motif) ||
      un.client_telephone.replace(/\D/g, "").includes(motif.replace(/\D/g, "") || motif) ||
      un.note.toLowerCase().includes(motif) ||
      un.agent.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: AppelEntree = {
        client_nom: form.client_nom,
        client_telephone: form.client_telephone,
        sens: form.sens,
        motif: form.motif,
        duree_secondes: form.duree_secondes,
        date: form.date || null,
        date_rappel: form.date_rappel || null,
        note: form.note,
      };
      await ecrire<Appel>("/appels", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Appel, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Appel>(`/appels/${un.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [un.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  const agents = comptes.filter((un) => un.role === "agent" || un.role === "responsable");

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("appels.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("appels.client")}</span>
              <input value={form.client_nom} onChange={(e) => setForm({ ...form, client_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("appels.telephone")}</span>
              <input value={form.client_telephone} onChange={(e) => setForm({ ...form, client_telephone: e.target.value })} inputMode="tel" placeholder="6 77 12 34 56" autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("appels.sens")}</span>
              <select value={form.sens} onChange={(e) => setForm({ ...form, sens: e.target.value })}>
                {SENS.map((un) => (
                  <option key={un} value={un}>{t(`sens.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("appels.motif")}</span>
              <select value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })}>
                {MOTIFS.map((un) => (
                  <option key={un} value={un}>{t(`motif.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("appels.date")}</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("appels.duree")}</span>
              <input type="number" min={0} max={86400} value={form.duree_secondes || ""} onChange={(e) => setForm({ ...form, duree_secondes: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("appels.date_rappel")}</span>
            <input type="date" value={form.date_rappel} onChange={(e) => setForm({ ...form, date_rappel: e.target.value })} />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("appels.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout"}>
              {enCours === "ajout" ? t("commun.ecriture") : t("appels.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("appels.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("appels.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("appels.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("appels.toutes")}</option>
            {STATUTS.map((un) => (
              <option key={un} value={un}>{t(`statut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li
            className={`cadc-ligne${un.statut === "en_file" ? " appel--file" : ""}${un.statut === "sans_reponse" || un.statut === "annule" ? " appel--perdu" : ""}${un.statut === "termine" ? " appel--clos" : ""}`}
            key={un.id}
          >
            <span className="cadc-ligne__nom">
              {un.client_nom || t(`sens.${un.sens}`)}
              <small>
                {f.jourDate(un.date)} · {t(`sens.${un.sens}`)} · {t(`motif.${un.motif}`)}
                {un.agent ? ` · ${un.agent}` : ""}
                {un.duree_secondes > 0 ? ` · ${un.duree_lisible}` : ""}
              </small>
              {un.client_telephone_display ? (
                <small>
                  {un.client_telephone_display}
                  {un.client_joignable ? ` · ${un.client_operateur}` : ""}
                </small>
              ) : null}
              {un.date_rappel ? (
                <small className="cadc-note cadc-note--acier">
                  {t("rappels.date")} : {f.jourDate(un.date_rappel)}
                </small>
              ) : null}
              {un.note ? <small>{un.note}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { statut: e.target.value })}
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>{t(`statut.${s}`)}</option>
                ))}
              </select>
              {un.statut === "en_file" || un.statut === "en_cours" ? (
                <select
                  value={un.agent_id ?? ""}
                  disabled={enCours === un.id}
                  onChange={(e) => corriger(un, { agent_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">{t("appels.agent")}</option>
                  {agents.map((unAgent) => (
                    <option key={unAgent.id} value={unAgent.id}>{unAgent.nom}</option>
                  ))}
                </select>
              ) : null}
              {erreurs[un.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[un.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
        {affiches.length === 0 ? (
          <li className="cadc-note">{t("commun.aucun")}</li>
        ) : null}
      </ul>
    </div>
  );
}
