"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { STATUTS_PIECE } from "@/lib/constantes";
import type { Client, Piece, PieceEntree } from "@/lib/types";

type Props = { pieces: Piece[]; clients: Client[]; langue: string };

const VIDE = {
  designation: "",
  compatibilite: "",
  stock: 1,
  prix_achat: 0,
  prix_vente: 0,
  note: "",
};

type Vente = { piece: Piece; quantite: number; client_id: string };

/**
 * Les pièces du stock : une fiche par pièce — la référence, la
 * désignation, la compatibilité, le stock, les prix. Vendre descend
 * le stock et porte son client ; réapprovisionner le remonte.
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
  const [vente, setVente] = useState<Vente | null>(null);

  const affiches = pieces.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.designation.toLowerCase().includes(motif) ||
      un.reference.toLowerCase().includes(motif) ||
      un.compatibilite.toLowerCase().includes(motif) ||
      un.note.toLowerCase().includes(motif) ||
      (un.client ?? "").toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: PieceEntree = {
        designation: form.designation,
        compatibilite: form.compatibilite,
        stock: form.stock,
        prix_achat: form.prix_achat,
        prix_vente: form.prix_vente,
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
      setVente((v) => (v && v.piece.id === un.id ? null : v));
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [un.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  function choisirStatut(un: Piece, statut: string) {
    if (statut === "vendu") {
      setVente({ piece: un, quantite: un.stock || 1, client_id: "" });
      return;
    }
    void corriger(un, { statut });
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
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.designation")}</span>
              <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.compatibilite")}</span>
              <input value={form.compatibilite} onChange={(e) => setForm({ ...form, compatibilite: e.target.value })} maxLength={120} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille cadc-grille--trois">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("pieces.stock")}</span>
              <input type="number" min={0} max={100000} value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
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
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout" || !form.designation.trim()}>
              {enCours === "ajout" ? t("commun.ecriture") : t("pieces.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille cadc-grille--deux">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("pieces.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("pieces.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("pieces.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("pieces.toutes")}</option>
            {STATUTS_PIECE.map((un) => (
              <option key={un} value={un}>{t(`pstatut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <span className="cadc-note">{t("pieces.stock_aide")}</span>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li
            className={`cadc-ligne${un.statut === "en_stock" ? " appel--file" : ""}${un.statut === "epuise" ? " appel--perdu" : ""}${un.statut === "vendu" ? " appel--clos" : ""}`}
            key={un.id}
          >
            <span className="cadc-ligne__nom">
              {un.designation}
              <small>
                {un.reference}{un.compatibilite ? ` · ${un.compatibilite}` : ""}
                {un.client ? ` · ${un.client}` : ""}
              </small>
              <small>
                <strong>{f.fcfa(un.prix_vente)}</strong>
                {` · ${t("pieces.stock")} ${un.stock}`}
                {un.date_vente ? ` · ${t("pieces.vendu_le")} ${f.jourDate(un.date_vente)}` : ""}
                {un.quantite_vendue ? ` · ×${un.quantite_vendue}` : ""}
              </small>
              {un.note ? <small>{un.note}</small> : null}
              {vente && vente.piece.id === un.id ? (
                <span className="cadc-pile cadc-pile--serree">
                  <label className="cadc-champ">
                    <span className="cadc-champ__titre">{t("pieces.quantite")}</span>
                    <input
                      type="number"
                      min={1}
                      max={un.stock || 1}
                      value={vente.quantite}
                      onChange={(e) => setVente({ ...vente, quantite: Number(e.target.value) || 1 })}
                      inputMode="numeric"
                    />
                  </label>
                  <label className="cadc-champ">
                    <span className="cadc-champ__titre">{t("pieces.client")}</span>
                    <select value={vente.client_id} onChange={(e) => setVente({ ...vente, client_id: e.target.value })}>
                      <option value="">—</option>
                      {clients.map((unClient) => (
                        <option key={unClient.id} value={unClient.id}>{unClient.nom}</option>
                      ))}
                    </select>
                  </label>
                  <span className="cadc-acts">
                    <button
                      type="button"
                      className="cadc-bouton cadc-bouton--petit cadc-bouton--premier"
                      disabled={enCours === un.id || !vente.client_id}
                      onClick={() => corriger(un, { statut: "vendu", quantite_vendue: vente.quantite, client_id: Number(vente.client_id) })}
                    >
                      {t("pieces.vendre")}
                    </button>
                    <button type="button" className="cadc-bouton cadc-bouton--petit" onClick={() => setVente(null)}>
                      {t("commun.fermer")}
                    </button>
                  </span>
                </span>
              ) : null}
            </span>
            <span className="cadc-ligne__valeur">
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => choisirStatut(un, e.target.value)}
              >
                {STATUTS_PIECE.map((s) => (
                  <option key={s} value={s}>{t(`pstatut.${s}`)}</option>
                ))}
              </select>
              {un.statut === "epuise" && un.stock === 0 ? (
                <button
                  type="button"
                  className="cadc-bouton cadc-bouton--petit"
                  disabled={enCours === un.id}
                  onClick={() => corriger(un, { stock: Math.max(1, un.quantite_vendue || 1) })}
                >
                  {t("pieces.reappro")}
                </button>
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
