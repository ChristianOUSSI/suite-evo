"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { BOITES, CARBURANTS, STATUTS } from "@/lib/constantes";
import type { Client, Vehicule, VehiculeEntree } from "@/lib/types";

type Props = { vehicules: Vehicule[]; clients: Client[]; langue: string };

const VIDE = {
  marque: "",
  modele: "",
  annee: new Date().getFullYear() - 3,
  kilometrage: 0,
  carburant: "essence",
  boite: "manuelle",
  prix: 0,
  note: "",
};

/**
 * Les véhicules du parc : une fiche par voiture — la marque, le modèle,
 * l'année, le kilométrage, le prix. Le statut se change d'un geste ;
 * la vente porte son client et sa date, rien ne s'efface.
 */
export function VehiculesGerant({ vehicules, clients, langue }: Props) {
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

  const affiches = vehicules.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.marque.toLowerCase().includes(motif) ||
      un.modele.toLowerCase().includes(motif) ||
      String(un.annee).includes(motif) ||
      un.note.toLowerCase().includes(motif) ||
      un.client.toLowerCase().includes(motif)
    );
  });

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: VehiculeEntree = {
        marque: form.marque,
        modele: form.modele,
        annee: form.annee,
        kilometrage: form.kilometrage,
        carburant: form.carburant,
        boite: form.boite,
        prix: form.prix,
        note: form.note,
      };
      await ecrire<Vehicule>("/vehicules", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Vehicule, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Vehicule>(`/vehicules/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("vehicules.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("vehicules.marque")}</span>
              <input value={form.marque} onChange={(e) => setForm({ ...form, marque: e.target.value })} maxLength={60} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("vehicules.modele")}</span>
              <input value={form.modele} onChange={(e) => setForm({ ...form, modele: e.target.value })} maxLength={80} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("vehicules.annee")}</span>
              <input type="number" min={1980} max={2100} value={form.annee} onChange={(e) => setForm({ ...form, annee: Number(e.target.value) || form.annee })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("vehicules.kilometrage")}</span>
              <input type="number" min={0} max={2000000} value={form.kilometrage || ""} onChange={(e) => setForm({ ...form, kilometrage: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("vehicules.carburant")}</span>
              <select value={form.carburant} onChange={(e) => setForm({ ...form, carburant: e.target.value })}>
                {CARBURANTS.map((un) => (
                  <option key={un} value={un}>{t(`carburant.${un}`)}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("vehicules.boite")}</span>
              <select value={form.boite} onChange={(e) => setForm({ ...form, boite: e.target.value })}>
                {BOITES.map((un) => (
                  <option key={un} value={un}>{t(`boite.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("vehicules.prix")}</span>
            <input type="number" min={0} max={500000000} value={form.prix || ""} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) || 0 })} inputMode="numeric" />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("vehicules.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout"}>
              {enCours === "ajout" ? t("commun.ecriture") : t("vehicules.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("vehicules.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("vehicules.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("vehicules.statut") ?? ""}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("vehicules.tous")}</option>
            {STATUTS.map((un) => (
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
                {un.annee} · {un.kilometrage.toLocaleString(langue === "en" ? "en-GB" : "fr-FR")} {t("vehicules.km")} · {t(`carburant.${un.carburant}`)} · {t(`boite.${un.boite}`)}
                {un.client ? ` · ${un.client}` : ""}
              </small>
              <small>
                <strong>{f.fcfa(un.prix)}</strong>
                {un.date_vente ? ` · ${t("vehicules.vendu_le")} ${f.jourDate(un.date_vente)}` : ""}
              </small>
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
