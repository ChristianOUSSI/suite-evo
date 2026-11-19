"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { MATIERES, STATUTS } from "@/lib/constantes";
import type { Client, Piece, PieceEntree } from "@/lib/types";

type Props = { pieces: Piece[]; clients: Client[]; langue: string };

const CARATS = ["", "9", "10", "14", "18", "21", "22", "24"];

const VIDE = {
  nom: "",
  matiere: "or",
  poids_grammes: 0,
  carat: "",
  prix_achat: 0,
  prix_vente: 0,
  fournisseur: "",
  note: "",
};

/**
 * Les pièces de la vitrine : une fiche par bijou - la référence, la
 * matière, le poids, le carat, les prix. Le statut se change d'un
 * geste ; la vente porte son client et sa date, rien ne s'efface.
 */
export function PiecesGerant({ pieces, clients, langue }: Props) {
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
  const [filtreMatiere, setFiltreMatiere] = useState("");

  const affiches = pieces.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (filtreMatiere && un.matiere !== filtreMatiere) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.nom.toLowerCase().includes(motif) ||
      un.reference.toLowerCase().includes(motif) ||
      un.fournisseur.toLowerCase().includes(motif) ||
      un.note.toLowerCase().includes(motif) ||
      un.client.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: PieceEntree = {
        nom: form.nom,
        matiere: form.matiere,
        poids_grammes: form.poids_grammes,
        carat: form.carat ? Number(form.carat) : null,
        prix_achat: form.prix_achat,
        prix_vente: form.prix_vente,
        fournisseur: form.fournisseur,
        note: form.note,
      };
      await ecrire<Piece>("/pieces", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Piece, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Piece>(`/pieces/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("pieces.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("pieces.nom")}</span>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={160} autoComplete="off" />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.matiere")}</span>
              <select value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })}>
                {MATIERES.map((un) => (
                  <option key={un} value={un}>{t(`matiere.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.carat")}</span>
              <select value={form.carat} onChange={(e) => setForm({ ...form, carat: e.target.value })}>
                {CARATS.map((un) => (
                  <option key={un} value={un}>{un === "" ? "-" : `${un} ct`}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.poids")}</span>
              <input type="number" min={0} max={100000} step="0.1" value={form.poids_grammes || ""} onChange={(e) => setForm({ ...form, poids_grammes: Number(e.target.value) || 0 })} inputMode="decimal" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.fournisseur")}</span>
              <input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} maxLength={120} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.prix_achat")}</span>
              <input type="number" min={0} max={500000000} value={form.prix_achat || ""} onChange={(e) => setForm({ ...form, prix_achat: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.prix_vente")}</span>
              <input type="number" min={0} max={500000000} value={form.prix_vente || ""} onChange={(e) => setForm({ ...form, prix_vente: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("pieces.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout"}>
              {enCours === "ajout" ? t("commun.ecriture") : t("pieces.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille cadc-grille--trois">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("pieces.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("pieces.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("pieces.matiere")}</span>
          <select value={filtreMatiere} onChange={(e) => setFiltreMatiere(e.target.value)}>
            <option value="">{t("pieces.toutes")}</option>
            {MATIERES.map((un) => (
              <option key={un} value={un}>{t(`matiere.${un}`)}</option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("pieces.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("pieces.toutes")}</option>
            {STATUTS.map((un) => (
              <option key={un} value={un}>{t(`statut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li
            className={`cadc-ligne${un.statut === "en_vitrine" ? " appel--file" : ""}${un.statut === "reserve" ? "" : un.statut === "retire" ? " appel--perdu" : ""}${un.statut === "vendu" ? " appel--clos" : ""}`}
            key={un.id}
          >
            <span className="cadc-ligne__nom">
              {un.nom}
              <small>
                {un.reference} · {t(`matiere.${un.matiere}`)}
                {un.poids_grammes > 0 ? ` · ${un.poids_grammes.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} g` : ""}
                {un.carat ? ` · ${un.carat} ct` : ""}
                {un.client ? ` · ${un.client}` : ""}
              </small>
              <small>
                <strong>{f.fcfa(un.prix_vente)}</strong>
                {un.prix_achat ? ` · ${f.fcfa(un.prix_achat)} ${langue === "en" ? "cost" : "achat"}` : ""}
                {un.date_vente ? ` · ${t("pieces.date_vente")} ${f.jourDate(un.date_vente)}` : ""}
              </small>
              {un.fournisseur || un.note ? <small>{[un.fournisseur, un.note].filter(Boolean).join(" · ")}</small> : null}
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
              {un.statut === "vendu" || un.statut === "reserve" ? (
                <select
                  value={un.client_id ?? ""}
                  disabled={enCours === un.id}
                  onChange={(e) => corriger(un, { client_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">{t("clients.nom")}</option>
                  {clients.map((unClient) => (
                    <option key={unClient.id} value={unClient.id}>{unClient.nom}</option>
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
