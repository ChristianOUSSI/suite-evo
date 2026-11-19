"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { CATEGORIES, STATUTS } from "@/lib/constantes";
import type { Document, DocumentEntree } from "@/lib/types";

type Props = { documents: Document[]; langue: string };

const VIDE = {
  titre: "",
  categorie: "autre",
  description: "",
  emetteur: "",
  destinataire: "",
  date_document: "",
  echeance: "",
  note: "",
};

/**
 * Les documents du classeur : une fiche par papier - la référence à dix
 * signes, la catégorie, l'émetteur, l'échéance. Le statut se change d'un
 * geste ; les retards se lisent d'un coup d'œil, rien ne s'efface.
 */
export function DocumentsGerant({ documents, langue }: Props) {
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

  const affiches = documents.filter((un) => {
    if (filtre === "actifs" && un.statut !== "actif") return false;
    if (filtre && filtre !== "actifs" && un.statut !== filtre) return false;
    if (filtre === "retard" && !un.en_retard) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.titre.toLowerCase().includes(motif) ||
      un.reference.toLowerCase().includes(motif) ||
      un.emetteur.toLowerCase().includes(motif) ||
      un.destinataire.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: DocumentEntree = {
        titre: form.titre,
        categorie: form.categorie,
        description: form.description,
        emetteur: form.emetteur,
        destinataire: form.destinataire,
        date_document: form.date_document || null,
        echeance: form.echeance || null,
        note: form.note,
      };
      await ecrire<Document>("/documents", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Document, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Document>(`/documents/${un.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [un.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  function lisEcheance(un: Document): string {
    if (un.echeance === null) return "";
    if (un.jours_restants === null) return f.jourDate(un.echeance);
    if (un.jours_restants < 0) {
      return t("echeances.depasse_de", { n: Math.abs(un.jours_restants) });
    }
    if (un.jours_restants === 0) return t("echeances.aujourdhui");
    return t("echeances.dans", { n: un.jours_restants });
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("documents.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("documents.titre_champ")}</span>
            <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} maxLength={200} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("documents.categorie")}</span>
              <select value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                {CATEGORIES.map((un) => (
                  <option key={un} value={un}>{t(`categorie.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("documents.date_document")}</span>
              <input type="date" value={form.date_document} onChange={(e) => setForm({ ...form, date_document: e.target.value })} />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("documents.echeance")}</span>
            <input type="date" value={form.echeance} onChange={(e) => setForm({ ...form, echeance: e.target.value })} />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("documents.emetteur")}</span>
              <input value={form.emetteur} onChange={(e) => setForm({ ...form, emetteur: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("documents.destinataire")}</span>
              <input value={form.destinataire} onChange={(e) => setForm({ ...form, destinataire: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("documents.description")}</span>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={3000} autoComplete="off" />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("documents.note")}</span>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || form.titre.trim().length < 2}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("documents.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("documents.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("documents.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("documents.categorie")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("echeances.toutes")}</option>
            <option value="actifs">{t("documents.actifs")}</option>
            <option value="retard">{t("echeances.retard")}</option>
            {STATUTS.map((un) => (
              <option key={un} value={un}>{t(`statut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li className={`cadc-ligne${un.en_retard ? " eleve--solde" : ""}${un.statut === "archive" || un.statut === "annule" ? " ouvrier--sorti" : ""}`} key={un.id}>
            <span className="cadc-ligne__nom">
              {un.titre}
              <small>
                {un.reference} · {t(`categorie.${un.categorie}`)} · {f.jourDate(un.date_document)}
                {un.emetteur ? ` · ${un.emetteur}` : ""}
                {un.destinataire ? ` → ${un.destinataire}` : ""}
                {un.cree_par ? ` · ${un.cree_par}` : ""}
              </small>
              {un.echeance ? (
                <small className={un.en_retard ? "cadc-note cadc-note--rouge" : ""}>
                  {t("documents.echeance")} : {f.jourDate(un.echeance)} · {lisEcheance(un)}
                </small>
              ) : null}
              {un.description ? <small>{un.description}</small> : null}
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
