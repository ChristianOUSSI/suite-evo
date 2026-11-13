"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { ISSUES_VISITE } from "@/lib/constantes";
import type { Bien, IssueVisite, Visite, VisiteEntree } from "@/lib/types";

type Props = { visites: Visite[]; biens: Bien[]; langue: string };

const VIDE = {
  bien_id: "",
  date: "",
  heure: "10:00",
  client_nom: "",
  client_telephone: "",
  note: "",
};

/**
 * Les visites programmées : le bien, le jour, l'heure, le client.
 * L'issue se note après — conclue, absente, refusée — et le passé
 * ne se réécrit pas.
 */
export function VisitesGerant({ visites, biens, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const disponibles = biens.filter((un) => un.statut === "disponible" || un.statut === "negociation");

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: VisiteEntree = {
        bien_id: parseInt(form.bien_id, 10),
        date: form.date || null,
        heure: form.heure,
        client_nom: form.client_nom,
        client_telephone: form.client_telephone ? `+237${form.client_telephone}` : "",
        note: form.note,
      };
      await ecrire<Visite>("/visites", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(visite: Visite, patch: Record<string, unknown>) {
    setEnCours(visite.id);
    setErreurs((actuelles) => ({ ...actuelles, [visite.id]: "" }));
    try {
      await ecrire<Visite>(`/visites/${visite.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [visite.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("visites.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("visites.bien")}</span>
              <select value={form.bien_id} onChange={(e) => setForm({ ...form, bien_id: e.target.value })}>
                <option value="">—</option>
                {disponibles.map((un) => (
                  <option key={un.id} value={un.id}>
                    {un.titre || `${t(`type.${un.type}`)} — ${un.quartier || un.ville}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("visites.jour")}</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("visites.heure")}</span>
              <input type="time" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("visites.client")}</span>
              <input value={form.client_nom} onChange={(e) => setForm({ ...form, client_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("demandes.telephone")}</span>
            <span className="cadc-champ__prefixe">
              <span>+237</span>
              <input
                value={form.client_telephone}
                onChange={(e) => setForm({ ...form, client_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                inputMode="tel"
                placeholder="6 XX XX XX XX"
              />
            </span>
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("biens.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || !form.bien_id}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("visites.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {visites.map((visite) => (
          <li className={`cadc-ligne${visite.issue === "ok" ? " eleve--dette" : ""}${visite.issue === "absent" || visite.issue === "refusee" ? " ouvrier--sorti" : ""}`} key={visite.id}>
            <span className="cadc-ligne__nom">
              {visite.client_nom || t("visites.client")}
              <small>
                {f.jourDate(visite.date)} · {visite.heure} · {t(`type.${visite.type}`)} — {visite.quartier}
                {visite.client_telephone_display ? ` · ${visite.client_telephone_display}` : ""}
                {visite.note ? ` · ${visite.note}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{visite.bien}</strong>
              <br />
              <select
                value={visite.issue}
                disabled={enCours === visite.id}
                onChange={(e) => corriger(visite, { issue: e.target.value as IssueVisite })}
              >
                {ISSUES_VISITE.map((un) => (
                  <option key={un} value={un}>{t(`issue.${un}`)}</option>
                ))}
              </select>
              {erreurs[visite.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[visite.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
