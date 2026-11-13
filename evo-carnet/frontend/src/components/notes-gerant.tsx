"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { CATEGORIES } from "@/lib/constantes";
import type { Note, NoteCorrection, NoteEntree } from "@/lib/types";

type Props = { notes: Note[]; archivees: Note[]; langue: string };

const VIDE = { titre: "", contenu: "", categorie: "perso" };

/**
 * Les notes du carnet : une fiche par note — le titre, le contenu, la
 * catégorie. Épingler la fait remonter, archiver la range, le code de
 * partage ouvre une page publique en lecture seule.
 */
export function NotesGerant({ notes, archivees: archiveesListe, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [edition, setEdition] = useState<Note | null>(null);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("");
  const [archivees, setArchivees] = useState(false);
  const [partage, setPartage] = useState<Note | null>(null);

  const source = archivees ? archiveesListe : notes;
  const affiches = source.filter((un) => {
    if (filtre && un.categorie !== filtre) return false;
    if (filtre && un.categorie !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.titre.toLowerCase().includes(motif) ||
      un.contenu.toLowerCase().includes(motif) ||
      t(`categorie.${un.categorie}`).toLowerCase().includes(motif)
    );
  });

  function ouvrirEdition(un: Note | null) {
    setEdition(un);
    setForm(un ? { titre: un.titre, contenu: un.contenu, categorie: un.categorie } : VIDE);
    setOuvert(true);
    setErreur(null);
  }

  async function enregistrer() {
    setEnCours("ajout");
    setErreur(null);
    try {
      if (edition) {
        const patch: NoteCorrection = {
          titre: form.titre,
          contenu: form.contenu,
          categorie: form.categorie,
        };
        await ecrire<Note>(`/notes/${edition.id}`, { method: "PATCH", body: patch, langue });
      } else {
        const corps: NoteEntree = {
          titre: form.titre,
          contenu: form.contenu,
          categorie: form.categorie,
        };
        await ecrire<Note>("/notes", { body: corps, langue });
      }
      setForm(VIDE);
      setEdition(null);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Note, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      const maj = await ecrire<Note>(`/notes/${un.id}`, { method: "PATCH", body: patch, langue });
      if (patch.nouveau_code) {
        setPartage((p) => (p && p.id === un.id ? { ...p, code_partage: maj.code_partage, lien: maj.lien } : p));
      }
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
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => ouvrirEdition(null)}>
          {ouvert && !edition ? t("commun.fermer") : t("notes.nouvelle")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("notes.titre-champ")}</span>
              <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("notes.categorie")}</span>
              <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                {CATEGORIES.map((un) => (
                  <option key={un} value={un}>{t(`categorie.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("notes.contenu")}</span>
            <textarea value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} maxLength={8000} rows={6} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={enregistrer} disabled={enCours === "ajout" || !form.titre.trim()}>
              {enCours === "ajout" ? t("commun.ecriture") : edition ? t("notes.modifier") : t("notes.nouvelle")}
            </button>
            {edition ? (
              <button type="button" className="cadc-bouton cadc-bouton--doux" onClick={() => ouvrirEdition(null)}>
                {t("commun.fermer")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("notes.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("notes.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("notes.categorie")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("notes.toutes")}</option>
            {CATEGORIES.map((un) => (
              <option key={un} value={un}>{t(`categorie.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--doux cadc-bouton--petit"
          onClick={() => { setArchivees((v) => !v); setFiltre(""); }}
        >
          {archivees ? t("notes.reactives") : t("notes.archivees")}
        </button>
      </div>

      <span className="cadc-note">{t("notes.aide")}</span>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li className="cadc-ligne" key={un.id}>
            <span className="cadc-ligne__nom">
              {un.epinglee ? "★ " : ""}{un.titre}
              <small>
                {t(`categorie.${un.categorie}`)} · {un.mots} {t("notes.mots")}
                {un.maj_le ? ` · ${t("notes.maj")} ${f.jourDate(un.maj_le)}` : ""}
              </small>
              {un.contenu ? <small>{un.contenu.length > 140 ? `${un.contenu.slice(0, 140)}…` : un.contenu}</small> : null}
              {partage && partage.id === un.id ? (
                <span className="cadc-pile cadc-pile--serree">
                  <span className="cadc-note cadc-note--acier">
                    {t("notes.lien")} : {partage.lien ?? `partage/${un.code_partage}`}
                  </span>
                  <span className="cadc-acts">
                    <a
                      className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                      href={partage.lien ?? `/partage/${un.code_partage}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("commun.voir")}
                    </a>
                    <button
                      type="button"
                      className="cadc-bouton cadc-bouton--petit"
                      disabled={enCours === un.id}
                      onClick={() => corriger(un, { nouveau_code: true })}
                    >
                      {t("notes.nouveauCode")}
                    </button>
                    <button type="button" className="cadc-bouton cadc-bouton--petit" onClick={() => setPartage(null)}>
                      {t("commun.fermer")}
                    </button>
                  </span>
                </span>
              ) : null}
            </span>
            <span className="cadc-ligne__valeur">
              <button
                type="button"
                className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                disabled={enCours === un.id}
                onClick={() => corriger(un, { epinglee: !un.epinglee })}
              >
                {un.epinglee ? t("notes.desepingler") : t("notes.epingler")}
              </button>
              <button
                type="button"
                className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                disabled={enCours === un.id}
                onClick={() => ouvrirEdition(un)}
              >
                {t("notes.modifier")}
              </button>
              <button
                type="button"
                className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                disabled={enCours === un.id}
                onClick={() => setPartage(un)}
              >
                {t("notes.partager")}
              </button>
              <button
                type="button"
                className="cadc-bouton cadc-bouton--petit"
                disabled={enCours === un.id}
                onClick={() => corriger(un, { archivee: !un.archivee })}
              >
                {un.archivee ? t("notes.desarchiver") : t("notes.archiver")}
              </button>
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
