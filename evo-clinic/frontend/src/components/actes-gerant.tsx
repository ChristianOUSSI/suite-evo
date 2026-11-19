"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Acte, ActeEntree, Patient } from "@/lib/types";

type Props = { actes: Acte[]; patients: Patient[]; langue: string; responsable: boolean };

const MOTIFS = [
  "Consultation générale",
  "Paludisme",
  "Hypertension",
  "Diabète",
  "Fièvre typhoïde",
  "Fracture",
  "Grossesse / suivi",
  "Pédiatrie",
  "Dépistage",
  "Vaccination",
  "Douleurs abdominales",
  "Allergie",
];

const VIDE = { patient_id: "", motif: MOTIFS[0], diagnostic: "", traitement: "", montant: 5000 };

/**
 * Les actes de la clinique : une consultation par ligne - motif, diagnostic,
 * traitement, prix figé. L'agent consigne ; seul le responsable annule.
 */
export function ActesGerant({ actes, patients, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const patientsActifs = patients.filter((un) => un.actif);

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: ActeEntree = {
        patient_id: Number(form.patient_id),
        motif: form.motif,
        diagnostic: form.diagnostic,
        traitement: form.traitement,
        montant: form.montant,
      };
      await ecrire<Acte>("/actes", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function annuler(acte: Acte) {
    setEnCours(acte.id);
    setErreurs((actuelles) => ({ ...actuelles, [acte.id]: "" }));
    try {
      await ecrire<Acte>(`/actes/${acte.id}`, { method: "PATCH", body: { annule: true }, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [acte.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("actes.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("actes.patient")}</span>
              <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                <option value="">-</option>
                {patientsActifs.map((un) => (
                  <option key={un.id} value={un.id}>{un.nom}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("actes.motif")}</span>
              <input list="motifs-clinique" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} maxLength={160} autoComplete="off" />
              <datalist id="motifs-clinique">
                {MOTIFS.map((m) => <option key={m} value={m} />)}
              </datalist>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("actes.diagnostic")}</span>
              <input value={form.diagnostic} onChange={(e) => setForm({ ...form, diagnostic: e.target.value })} maxLength={2000} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("actes.traitement")}</span>
              <input value={form.traitement} onChange={(e) => setForm({ ...form, traitement: e.target.value })} maxLength={2000} autoComplete="off" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("actes.montant")}</span>
            <input type="number" min={0} step={500} value={form.montant} onChange={(e) => setForm({ ...form, montant: Number(e.target.value) })} />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || !form.patient_id || form.motif.trim().length < 2}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("actes.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {actes.map((acte) => (
          <li className={`cadc-ligne${acte.annule ? " ouvrier--sorti" : ""}`} key={acte.id}>
            <span className="cadc-ligne__nom">
              {acte.patient}
              <small>
                {acte.motif}
                {acte.diagnostic ? ` · ${acte.diagnostic}` : ""}
                {acte.traitement ? ` · ${acte.traitement}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(acte.montant)}</strong>
              <br />
              <small>{f.jourDate(acte.date)}</small>
              {acte.annule ? <span className="cadc-badge cadc-badge--rouge">{t("actes.annule")}</span> : null}
              {responsable && !acte.annule ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === acte.id}
                    onClick={() => annuler(acte)}
                  >
                    {t("actes.annuler")}
                  </button>
                </span>
              ) : null}
              {erreurs[acte.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[acte.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
