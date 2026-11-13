"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Classe, Eleve, EleveEntree } from "@/lib/types";

type Props = { eleves: Eleve[]; classes: Classe[]; langue: string; responsable: boolean };

const VIDE = {
  classe_id: "",
  nom: "",
  matricule: "",
  parent_nom: "",
  parent_telephone: "",
  frais_attendu: "",
  note: "",
};

/**
 * Les élèves de l'école : une fiche par enfant, son payé, son reste.
 * Le responsable seul y touche ; le comptable lit.
 */
export function ElevesGerant({ eleves, classes, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [seulementRestants, setSeulementRestants] = useState(false);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const classesActives = classes.filter((un) => un.actif);
  const affiches = seulementRestants ? eleves.filter((un) => un.reste > 0) : eleves;

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: EleveEntree = {
        classe_id: Number(form.classe_id),
        nom: form.nom,
        matricule: form.matricule,
        parent_nom: form.parent_nom,
        parent_telephone: form.parent_telephone ? `+237${form.parent_telephone}` : "",
        frais_attendu: form.frais_attendu ? Number(form.frais_attendu) : null,
        note: form.note,
      };
      await ecrire<Eleve>("/eleves", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(eleve: Eleve, patch: Record<string, unknown>) {
    setEnCours(eleve.id);
    setErreurs((actuelles) => ({ ...actuelles, [eleve.id]: "" }));
    try {
      await ecrire<Eleve>(`/eleves/${eleve.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [eleve.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        {responsable ? (
          <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
            {ouvert ? t("commun.fermer") : t("eleves.nouveau")}
          </button>
        ) : null}
        <button
          type="button"
          className={`cadc-bouton ${seulementRestants ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
          onClick={() => setSeulementRestants((v) => !v)}
        >
          {t("eleves.restants")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("classes.nom")}</span>
              <select value={form.classe_id} onChange={(e) => setForm({ ...form, classe_id: e.target.value })}>
                <option value="">—</option>
                {classesActives.map((un) => (
                  <option key={un.id} value={un.id}>{un.nom}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("eleves.nom")}</span>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("eleves.matricule")}</span>
              <input value={form.matricule} onChange={(e) => setForm({ ...form, matricule: e.target.value })} maxLength={24} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("eleves.frais")}</span>
              <input type="number" min={0} step={5000} value={form.frais_attendu} onChange={(e) => setForm({ ...form, frais_attendu: e.target.value })} placeholder={t("classes.frais")} />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("eleves.parent")}</span>
              <input value={form.parent_nom} onChange={(e) => setForm({ ...form, parent_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("eleves.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input
                  value={form.parent_telephone}
                  onChange={(e) => setForm({ ...form, parent_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                  inputMode="tel"
                  placeholder="6 XX XX XX XX"
                />
              </span>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("clients.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || !form.classe_id || form.nom.trim().length < 2}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("eleves.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((eleve) => {
          const classe = eleve.reste <= 0 ? "" : eleve.solde > eleve.reste ? " eleve--dette" : " eleve--solde";
          return (
            <li className={`cadc-ligne${classe}${eleve.actif ? "" : " ouvrier--sorti"}`} key={eleve.id}>
              <span className="cadc-ligne__nom">
                {eleve.nom}
                <small>
                  {eleve.classe}
                  {eleve.matricule ? ` · ${eleve.matricule}` : ""}
                  {eleve.parent_nom ? ` · ${eleve.parent_nom}` : ""}
                  {eleve.parent_telephone_display ? ` · ${eleve.parent_telephone_display}` : ""}
                </small>
              </span>
              <span className="cadc-ligne__valeur">
                <strong>{f.fcfa(eleve.paye)}</strong>
                <br />
                <small>
                  {t("eleves.reste")} {f.fcfa(eleve.reste)} · {t("eleves.solde")} {f.fcfa(eleve.solde)}
                </small>
                {responsable ? (
                  <span className="cadc-acts">
                    <button
                      type="button"
                      className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                      disabled={enCours === eleve.id}
                      onClick={() => corriger(eleve, { actif: !eleve.actif })}
                    >
                      {eleve.actif ? t("chambres.sortir") : t("chambres.reprendre")}
                    </button>
                  </span>
                ) : null}
                {erreurs[eleve.id] ? (
                  <span className="cadc-note cadc-note--rouge" role="status">{erreurs[eleve.id]}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
