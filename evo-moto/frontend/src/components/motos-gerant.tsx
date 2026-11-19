"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { STATUTS_MOTO } from "@/lib/constantes";
import type { Client, Moto, MotoEntree } from "@/lib/types";

type Props = { motos: Moto[]; clients: Client[]; langue: string };

const VIDE = {
  marque: "",
  modele: "",
  annee: new Date().getFullYear() - 2,
  kilometrage: 0,
  couleur: "",
  prix: 0,
  note: "",
};

/**
 * Les motos du garage : une fiche par moto - la marque, le modèle,
 * l'année, le kilométrage, la couleur, le prix. Le statut se change
 * d'un geste ; la vente porte son client et sa date, rien ne s'efface.
 */
export function MotosGerant({ motos, clients, langue }: Props) {
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
  const [filtreMarque, setFiltreMarque] = useState("");

  const marques = Array.from(new Set(motos.map((un) => un.marque))).sort();

  const affiches = motos.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (filtreMarque && un.marque !== filtreMarque) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.marque.toLowerCase().includes(motif) ||
      un.modele.toLowerCase().includes(motif) ||
      un.couleur.toLowerCase().includes(motif) ||
      String(un.annee).includes(motif) ||
      un.note.toLowerCase().includes(motif) ||
      un.client.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: MotoEntree = {
        marque: form.marque,
        modele: form.modele,
        annee: form.annee,
        kilometrage: form.kilometrage,
        couleur: form.couleur,
        prix: form.prix,
        note: form.note,
      };
      await ecrire<Moto>("/motos", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Moto, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Moto>(`/motos/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("motos.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("motos.marque")}</span>
              <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} maxLength={60} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("motos.modele")}</span>
              <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} maxLength={80} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("motos.annee")}</span>
              <input type="number" min={1990} max={2100} value={form.annee} onChange={(e) => setForm({ ...form, annee: Number(e.target.value) || form.annee })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("motos.kilometrage")}</span>
              <input type="number" min={0} max={500000} value={form.kilometrage || ""} onChange={(e) => setForm({ ...form, kilometrage: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("motos.couleur")}</span>
              <input value={form.couleur} onChange={(e) => setForm({ ...form, couleur: e.target.value })} maxLength={40} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("motos.prix")}</span>
              <input type="number" min={0} max={500000000} value={form.prix || ""} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("motos.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout"}>
              {enCours === "ajout" ? t("commun.ecriture") : t("motos.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille cadc-grille--trois">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("motos.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("motos.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("motos.marque")}</span>
          <select value={filtreMarque} onChange={(e) => setFiltreMarque(e.target.value)}>
            <option value="">{t("motos.toutes")}</option>
            {marques.map((un) => (
              <option key={un} value={un}>{un}</option>
            ))}
          </select>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("motos.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("motos.toutes")}</option>
            {STATUTS_MOTO.map((un) => (
              <option key={un} value={un}>{t(`statut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => (
          <li
            className={`cadc-ligne${un.statut === "en_vente" ? " appel--file" : ""}${un.statut === "reserve" ? "" : un.statut === "retire" ? " appel--perdu" : ""}${un.statut === "vendu" ? " appel--clos" : ""}`}
            key={un.id}
          >
            <span className="cadc-ligne__nom">
              {un.marque} {un.modele}
              <small>
                {un.annee} · {un.kilometrage.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} {t("motos.km")}
                {un.couleur ? ` · ${un.couleur}` : ""}
                {un.client ? ` · ${un.client}` : ""}
              </small>
              <small>
                <strong>{f.fcfa(un.prix)}</strong>
                {un.date_vente ? ` · ${t("motos.vendu_le")} ${f.jourDate(un.date_vente)}` : ""}
              </small>
              {un.note ? <small>{un.note}</small> : null}
            </span>
            <span className="cadc-ligne__valeur">
              <select
                value={un.statut}
                disabled={enCours === un.id}
                onChange={(e) => corriger(un, { statut: e.target.value })}
              >
                {STATUTS_MOTO.map((s) => (
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
