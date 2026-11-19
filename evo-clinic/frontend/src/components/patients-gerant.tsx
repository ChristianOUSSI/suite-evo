"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Patient, PatientEntree } from "@/lib/types";

type Props = { patients: Patient[]; langue: string; responsable: boolean };

const VIDE = {
  nom: "",
  telephone: "",
  naissance: "",
  sexe: "",
  groupe: "",
  allergies: "",
  note: "",
};

/**
 * Les patients de la clinique : une fiche par personne, son groupe, ses
 * allergies, son reste dû. L'agent inscrit le patient du jour ; le
 * responsable seul le « sort » du registre.
 */
export function PatientsGerant({ patients, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [seulementDetteurs, setSeulementDetteurs] = useState(false);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const affiches = seulementDetteurs ? patients.filter((un) => un.dus > 0) : patients;

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: PatientEntree = {
        nom: form.nom,
        telephone: form.telephone ? `+237${form.telephone}` : "",
        naissance: form.naissance || null,
        sexe: form.sexe,
        groupe: form.groupe,
        allergies: form.allergies,
        note: form.note,
      };
      await ecrire<Patient>("/patients", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(patient: Patient, patch: Record<string, unknown>) {
    setEnCours(patient.id);
    setErreurs((actuelles) => ({ ...actuelles, [patient.id]: "" }));
    try {
      await ecrire<Patient>(`/patients/${patient.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [patient.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("patients.nouveau")}
        </button>
        <button
          type="button"
          className={`cadc-bouton ${seulementDetteurs ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
          onClick={() => setSeulementDetteurs((v) => !v)}
        >
          {t("patients.reste")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("patients.nom")}</span>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("patients.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                  inputMode="tel"
                  placeholder="6 XX XX XX XX"
                />
              </span>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("patients.naissance")}</span>
              <input type="date" value={form.naissance} onChange={(e) => setForm({ ...form, naissance: e.target.value })} />
            </label>
            <div className="cadc-grille">
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("patients.sexe")}</span>
                <select value={form.sexe} onChange={(e) => setForm({ ...form, sexe: e.target.value })}>
                  <option value="">-</option>
                  <option value="femme">{langue === "en" ? "Woman" : "Femme"}</option>
                  <option value="homme">{langue === "en" ? "Man" : "Homme"}</option>
                </select>
              </label>
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("patients.groupe")}</span>
                <select value={form.groupe} onChange={(e) => setForm({ ...form, groupe: e.target.value })}>
                  <option value="">-</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("patients.allergies")}</span>
            <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} maxLength={600} autoComplete="off" placeholder={langue === "en" ? "e.g. penicillin" : "ex. pénicilline"} />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("patients.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || form.nom.trim().length < 2}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("patients.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((patient) => (
          <li className={`cadc-ligne${patient.dus > 0 ? " eleve--dette" : ""}${patient.actif ? "" : " ouvrier--sorti"}`} key={patient.id}>
            <span className="cadc-ligne__nom">
              <Link href={`/patients/${patient.id}`}>{patient.nom}</Link>
              <small>
                {patient.groupe ? `${t("patients.groupe")} ${patient.groupe}` : ""}
                {patient.sexe ? ` · ${patient.sexe}` : ""}
                {patient.naissance ? ` · ${f.date(patient.naissance)}` : ""}
                {patient.telephone_display ? ` · ${patient.telephone_display}` : ""}
                {patient.allergies ? ` · ⚠ ${patient.allergies}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              {patient.dus > 0 ? (
                <>
                  <strong>{f.fcfa(patient.dus)}</strong>
                  <br />
                  <small>{t("patients.dus")}</small>
                </>
              ) : (
                <small>{t("patients.rien")}</small>
              )}
              <br />
              <small>
                {patient.actes} {t("patients.actes")}
              </small>
              {responsable ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === patient.id}
                    onClick={() => corriger(patient, { actif: !patient.actif })}
                  >
                    {patient.actif ? t("chambres.sortir") : t("chambres.reprendre")}
                  </button>
                </span>
              ) : null}
              {erreurs[patient.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[patient.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
