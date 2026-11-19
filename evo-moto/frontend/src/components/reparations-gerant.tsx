"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { STATUTS_REPARATION } from "@/lib/constantes";
import type { Client, Moto, Reparation, ReparationEntree } from "@/lib/types";

type Props = { reparations: Reparation[]; clients: Client[]; motos: Moto[]; langue: string };

const VIDE = {
  client_id: "",
  moto_id: "",
  immatriculation: "",
  panne: "",
  travaux: "",
  cout_main_oeuvre: 0,
  cout_pieces: 0,
  date_reception: "",
  note: "",
};

/**
 * Les réparations de l'atelier : une fiche par entrée - le client, la
 * panne, les travaux, la main-d'œuvre, les pièces. Le statut avance
 * d'un geste : reçue → en cours → terminée → livrée.
 */
export function ReparationsGerant({ reparations, clients, motos, langue }: Props) {
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

  const affiches = reparations.filter((un) => {
    if (filtre && un.statut !== filtre) return false;
    if (!recherche.trim()) return true;
    const motif = recherche.trim().toLowerCase();
    return (
      un.panne.toLowerCase().includes(motif) ||
      un.travaux.toLowerCase().includes(motif) ||
      un.immatriculation.toLowerCase().includes(motif) ||
      un.client.toLowerCase().includes(motif) ||
      un.moto.toLowerCase().includes(motif) ||
      un.note.toLowerCase().includes(motif)
    );
  });

  const suivant = (statut: string): string => {
    const ordre = ["recue", "en_cours", "terminee", "livree"];
    const i = ordre.indexOf(statut);
    return i >= 0 && i < ordre.length - 1 ? ordre[i + 1] : "";
  };

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: ReparationEntree = {
        client_id: Number(form.client_id),
        moto_id: form.moto_id ? Number(form.moto_id) : null,
        immatriculation: form.immatriculation,
        panne: form.panne,
        travaux: form.travaux,
        cout_main_oeuvre: form.cout_main_oeuvre,
        cout_pieces: form.cout_pieces,
        date_reception: form.date_reception || null,
        note: form.note,
      };
      await ecrire<Reparation>("/reparations", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(un: Reparation, patch: Record<string, unknown>) {
    setEnCours(un.id);
    setErreurs((actuelles) => ({ ...actuelles, [un.id]: "" }));
    try {
      await ecrire<Reparation>(`/reparations/${un.id}`, { method: "PATCH", body: patch, langue });
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
          {ouvert ? t("commun.fermer") : t("rep.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("rep.client")}</span>
              <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">-</option>
                {clients.map((un) => (
                  <option key={un.id} value={un.id}>{un.nom}</option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("rep.moto")}</span>
              <select value={form.moto_id} onChange={(e) => setForm({ ...form, moto_id: e.target.value })}>
                <option value="">-</option>
                {motos.map((un) => (
                  <option key={un.id} value={un.id}>{un.marque} {un.modele}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("rep.immatriculation")}</span>
              <input value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} maxLength={20} autoComplete="off" placeholder="LT-1234-A" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("rep.date_reception")}</span>
              <input type="date" value={form.date_reception} onChange={(e) => setForm({ ...form, date_reception: e.target.value })} />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("rep.panne")}</span>
            <input value={form.panne} onChange={(e) => setForm({ ...form, panne: e.target.value })} maxLength={160} autoComplete="off" />
          </label>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("rep.travaux")}</span>
            <textarea value={form.travaux} onChange={(e) => setForm({ ...form, travaux: e.target.value })} maxLength={1000} rows={2} />
          </label>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("rep.main_oeuvre")}</span>
              <input type="number" min={0} max={100000000} value={form.cout_main_oeuvre || ""} onChange={(e) => setForm({ ...form, cout_main_oeuvre: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("rep.pieces")}</span>
              <input type="number" min={0} max={100000000} value={form.cout_pieces || ""} onChange={(e) => setForm({ ...form, cout_pieces: Number(e.target.value) || 0 })} inputMode="numeric" />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("rep.note")}</span>
            <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} maxLength={600} rows={2} />
          </label>
          {erreur ? (
            <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span>
          ) : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours === "ajout" || !form.client_id || !form.panne.trim()}>
              {enCours === "ajout" ? t("commun.ecriture") : t("rep.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("rep.recherche")}</span>
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder={t("rep.recherche-aide")} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("rep.statut")}</span>
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
            <option value="">{t("rep.toutes")}</option>
            {STATUTS_REPARATION.map((un) => (
              <option key={un} value={un}>{t(`rstatut.${un}`)}</option>
            ))}
          </select>
        </label>
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((un) => {
          const etape = suivant(un.statut);
          return (
            <li
              className={`cadc-ligne${un.statut === "recue" ? " appel--file" : ""}${un.statut === "en_cours" ? "" : un.statut === "livree" ? " appel--clos" : ""}`}
              key={un.id}
            >
              <span className="cadc-ligne__nom">
                {un.panne}
                <small>
                  {un.client}{un.moto ? ` · ${un.moto}` : ""}{un.immatriculation ? ` · ${un.immatriculation}` : ""}
                  {un.date_reception ? ` · ${t("rep.date_reception")} ${f.jourDate(un.date_reception)}` : ""}
                </small>
                {un.travaux ? <small>{un.travaux}</small> : null}
                <small>
                  <strong>{f.fcfa(un.cout_total)}</strong>
                  {un.cout_main_oeuvre || un.cout_pieces
                    ? ` · ${f.fcfa(un.cout_main_oeuvre)} + ${f.fcfa(un.cout_pieces)}`
                    : ""}
                  {un.date_livraison ? ` · ${t("rep.date_livraison")} ${f.jourDate(un.date_livraison)}` : ""}
                </small>
                {un.note ? <small>{un.note}</small> : null}
              </span>
              <span className="cadc-ligne__valeur">
                {etape ? (
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--premier"
                    disabled={enCours === un.id}
                    onClick={() => corriger(un, { statut: etape })}
                  >
                    {t("rep.avancer")} · {t(`rstatut.${etape}`)}
                  </button>
                ) : null}
                <select
                  value={un.statut}
                  disabled={enCours === un.id}
                  onChange={(e) => corriger(un, { statut: e.target.value })}
                >
                  {STATUTS_REPARATION.map((s) => (
                    <option key={s} value={s}>{t(`rstatut.${s}`)}</option>
                  ))}
                </select>
                {erreurs[un.id] ? (
                  <span className="cadc-note cadc-note--rouge" role="status">{erreurs[un.id]}</span>
                ) : null}
              </span>
            </li>
          );
        })}
        {affiches.length === 0 ? (
          <li className="cadc-note">{t("commun.aucun")}</li>
        ) : null}
      </ul>
    </div>
  );
}
