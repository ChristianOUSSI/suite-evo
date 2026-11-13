"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { CANAUX } from "@/lib/constantes";
import type { Bien, Canal, Demande, DemandeEntree, StatutDemande } from "@/lib/types";

type Props = { demandes: Demande[]; biens: Bien[]; langue: string };

const VIDE = {
  bien_id: "",
  client_nom: "",
  client_telephone: "",
  canal: "telephone" as Canal,
  message: "",
};

/**
 * Les demandes des clients : chaque contact a son canal et son suivi.
 * Le statut avance : nouvelle → contactée → visite → convertie ou perdue.
 * Un client qui demande « le bien de Bonapriso » sans le nommer reste
 * enregistré — le bien est optionnel.
 */
export function DemandesGerant({ demandes, biens, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [seulementOuvertes, setSeulementOuvertes] = useState(true);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const affiches = seulementOuvertes
    ? demandes.filter((un) => un.statut !== "convertie" && un.statut !== "perdue")
    : demandes;

  const suivant: Record<StatutDemande, StatutDemande | null> = {
    nouvelle: "contactee",
    contactee: "visite",
    visite: "convertie",
    convertie: null,
    perdue: "contactee",
  };

  async function ajouter() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: DemandeEntree = {
        bien_id: form.bien_id ? parseInt(form.bien_id, 10) : null,
        client_nom: form.client_nom,
        client_telephone: form.client_telephone ? `+237${form.client_telephone}` : "",
        canal: form.canal,
        message: form.message,
      };
      await ecrire<Demande>("/demandes", { body: corps, langue });
      setForm(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function avancer(demande: Demande) {
    const statut = suivant[demande.statut];
    if (!statut) return;
    setEnCours(demande.id);
    setErreurs((actuelles) => ({ ...actuelles, [demande.id]: "" }));
    try {
      await ecrire<Demande>(`/demandes/${demande.id}`, { method: "PATCH", body: { statut }, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [demande.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  async function corriger(demande: Demande, patch: Record<string, unknown>) {
    setEnCours(demande.id);
    setErreurs((actuelles) => ({ ...actuelles, [demande.id]: "" }));
    try {
      await ecrire<Demande>(`/demandes/${demande.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [demande.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? t("commun.fermer") : t("demandes.nouveau")}
        </button>
        <button
          type="button"
          className={`cadc-bouton ${seulementOuvertes ? "cadc-bouton--premier" : "cadc-bouton--doux"}`}
          onClick={() => setSeulementOuvertes((v) => !v)}
        >
          {t("demandes.ouvertes")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("demandes.client")}</span>
              <input value={form.client_nom} onChange={(e) => setForm({ ...form, client_nom: e.target.value })} maxLength={160} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("demandes.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input
                  value={form.client_telephone}
                  onChange={(e) => setForm({ ...form, client_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
                  inputMode="tel"
                  placeholder="6 XX XX XX XX"
                />
              </span>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("demandes.bien")}</span>
              <select value={form.bien_id} onChange={(e) => setForm({ ...form, bien_id: e.target.value })}>
                <option value="">—</option>
                {biens.map((un) => (
                  <option key={un.id} value={un.id}>
                    {un.titre || `${t(`type.${un.type}`)} — ${un.quartier || un.ville}`} · {f.court(un.prix)}
                  </option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("demandes.canal")}</span>
              <select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value as Canal })}>
                {CANAUX.map((un) => (
                  <option key={un} value={un}>{t(`canal.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("demandes.message")}</span>
            <input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={600} autoComplete="off" />
          </label>
          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}
          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || form.client_nom.trim().length < 2}
              onClick={ajouter}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("demandes.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {affiches.map((demande) => (
          <li className={`cadc-ligne${demande.statut === "convertie" ? " eleve--dette" : ""}${demande.statut === "perdue" ? " ouvrier--sorti" : ""}`} key={demande.id}>
            <span className="cadc-ligne__nom">
              {demande.client_nom}
              <small>
                {t(`canal.${demande.canal}`)} · {f.jourDate(demande.date)}
                {demande.bien ? ` · ${demande.bien}` : ` · ${t("demandes.bien")} ?`}
                {demande.client_telephone_display ? ` · ${demande.client_telephone_display}` : ""}
                {demande.cree_par ? ` · ${demande.cree_par}` : ""}
                {demande.message ? ` · « ${demande.message} »` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <small>{t(`dstatut.${demande.statut}`)}</small>
              <br />
              <span className="cadc-acts">
                <button
                  type="button"
                  className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                  disabled={enCours === demande.id}
                  onClick={() => corriger(demande, { statut: "perdue" })}
                >
                  {t("dstatut.perdue")}
                </button>
                {suivant[demande.statut] && suivant[demande.statut] !== "contactee" ? (
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--premier"
                    disabled={enCours === demande.id}
                    onClick={() => avancer(demande)}
                  >
                    {t(`dstatut.${suivant[demande.statut]}`)} →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--premier"
                    disabled={enCours === demande.id}
                    onClick={() => avancer(demande)}
                  >
                    {t(`dstatut.${suivant[demande.statut]}`)} →
                  </button>
                )}
              </span>
              {erreurs[demande.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[demande.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
