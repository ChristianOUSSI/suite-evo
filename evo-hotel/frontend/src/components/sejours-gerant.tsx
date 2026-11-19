"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Chambre, Client, Sejour, SejourEntree, StatutSejour } from "@/lib/types";

type Props = {
  sejours: Sejour[];
  chambres: Chambre[];
  clients: Client[];
  langue: string;
};

const AUJOURD_HUI = () => new Date().toISOString().slice(0, 10);

/**
 * Le cahier des séjours : la réservation, puis les gestes du séjour.
 * Une chambre occupée ne se propose jamais deux fois - le backend refuse,
 * l'écran propose les chambres libres pour les dates demandées.
 */
export function SejoursGerant({ sejours, chambres, clients, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    chambre_id: "",
    client_id: "",
    client_nom: "",
    client_telephone: "",
    arrivee: AUJOURD_HUI(),
    depart: "",
    note: "",
  });
  const [libres, setLibres] = useState<number[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  const chambresActives = chambres.filter((un) => un.actif);
  const clientsActifs = clients.filter((un) => un.actif);

  async function verifierDisponibilite() {
    setErreur(null);
    try {
      const corps = await ecrire<{ chambres: { id: number }[] }>(
        `/disponibilite?arrivee=${form.arrivee}&depart=${form.depart}`,
        { method: "GET", langue },
      );
      setLibres(corps.chambres.map((un) => un.id));
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    }
  }

  async function reserver() {
    setEnCours("ajout");
    setErreur(null);
    try {
      const corps: SejourEntree = {
        chambre_id: Number(form.chambre_id),
        client_id: form.client_id ? Number(form.client_id) : null,
        client_nom: form.client_nom,
        client_telephone: form.client_telephone,
        arrivee: form.arrivee,
        depart: form.depart,
        note: form.note,
      };
      await ecrire<Sejour>("/sejours", { body: corps, langue });
      setOuvert(false);
      setForm({ ...form, client_nom: "", client_telephone: "", note: "", depart: "" });
      setLibres(null);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function changerStatut(sejour: Sejour, statut: StatutSejour) {
    setEnCours(sejour.id);
    setErreur(null);
    try {
      await ecrire<Sejour>(`/sejours/${sejour.id}`, {
        method: "PATCH",
        body: { statut },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={() => setOuvert((v) => !v)}
        >
          {ouvert ? t("commun.fermer") : t("sejours.nouveau")}
        </button>
      </div>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("chambres.numero")}</span>
              <select
                value={form.chambre_id}
                onChange={(e) => {
                  setForm({ ...form, chambre_id: e.target.value });
                  setLibres(null);
                }}
              >
                <option value="">-</option>
                {chambresActives.map((un) => (
                  <option key={un.id} value={un.id}>
                    {un.numero} · {t(`type.${un.type}`)} · {f.fcfa(un.prix_par_nuit)}/{t("recap.nuits").slice(0, 5)}
                  </option>
                ))}
              </select>
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("sejours.arrivee")}</span>
              <input
                type="date"
                value={form.arrivee}
                onChange={(e) => {
                  setForm({ ...form, arrivee: e.target.value });
                  setLibres(null);
                }}
              />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("sejours.depart")}</span>
              <input
                type="date"
                value={form.depart}
                min={form.arrivee}
                onChange={(e) => {
                  setForm({ ...form, depart: e.target.value });
                  setLibres(null);
                }}
              />
            </label>
            <div className="cadc-acts" style={{ alignSelf: "end" }}>
              <button
                type="button"
                className="cadc-bouton cadc-bouton--doux"
                onClick={verifierDisponibilite}
                disabled={!form.chambre_id || !form.depart || form.depart <= form.arrivee}
              >
                {t("sejours.nouveau") === "" ? "" : t("commun.voir")}
              </button>
            </div>
          </div>

          {libres ? (
            <p className={`cadc-note ${libres.includes(Number(form.chambre_id)) ? "cadc-note--vert" : "cadc-note--rouge"}`} role="status">
              {libres.includes(Number(form.chambre_id))
                ? t("statut.confirmee")
                : t("chambres.vide")}
            </p>
          ) : null}

          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("clients.nom")}</span>
              {clientsActifs.length > 0 ? (
                <select
                  value={form.client_id}
                  onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                >
                  <option value="">- {t("clients.nouveau")} -</option>
                  {clientsActifs.map((un) => (
                    <option key={un.id} value={un.id}>
                      {un.nom}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.client_nom}
                  onChange={(e) => setForm({ ...form, client_nom: e.target.value })}
                  maxLength={160}
                />
              )}
            </label>
            {!form.client_id ? (
              <label className="cadc-champ">
                <span className="cadc-champ__titre">{t("clients.telephone")}</span>
                <span className="cadc-champ__prefixe">
                  <span>+237</span>
                  <input
                    value={form.client_telephone.replace(/^\+?237/, "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        client_telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9),
                      })
                    }
                    inputMode="tel"
                    placeholder="6 XX XX XX XX"
                  />
                </span>
                <span className="cadc-champ__aide">{t("clients.telephone-aide")}</span>
              </label>
            ) : null}
          </div>

          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("clients.note")}</span>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              maxLength={600}
            />
          </label>

          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}

          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={
                enCours !== null ||
                !form.chambre_id ||
                !form.arrivee ||
                !form.depart ||
                form.depart <= form.arrivee ||
                (!form.client_id && form.client_nom.trim().length < 2)
              }
              onClick={reserver}
            >
              {enCours === "ajout" ? t("commun.ecriture") : t("sejours.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {sejours.map((sejour) => {
          const statut = sejour.statut_effectif ?? sejour.statut;
          const occupe = enCours === sejour.id;
          return (
            <li className="cadc-ligne" key={sejour.id}>
              <span className="cadc-ligne__nom">
                {sejour.client}
                <small>
                  {sejour.chambre} · {t(`type.${sejour.chambre_type}`)} ·{" "}
                  {f.date(sejour.arrivee)} → {f.date(sejour.depart)} · {sejour.nuits}{" "}
                  {t("sejours.nuits")}
                </small>
                {sejour.note ? <small>{sejour.note}</small> : null}
              </span>
              <span className="cadc-ligne__valeur">
                {f.fcfa(sejour.montant)}
                <br />
                <span className="cadc-badge cadc-badge--doux">{t(`statut.${statut}`)}</span>
                <span className="cadc-acts" style={{ marginTop: 6 }}>
                  {statut === "confirmee" ? (
                    <button
                      type="button"
                      className="cadc-bouton cadc-bouton--petit"
                      disabled={occupe}
                      onClick={() => changerStatut(sejour, "en_cours")}
                    >
                      {t("statut.en_cours")}
                    </button>
                  ) : null}
                  {statut === "en_cours" ? (
                    <button
                      type="button"
                      className="cadc-bouton cadc-bouton--petit"
                      disabled={occupe}
                      onClick={() => changerStatut(sejour, "terminee")}
                    >
                      {t("statut.terminee")}
                    </button>
                  ) : null}
                  {statut !== "terminee" && statut !== "annulee" ? (
                    <button
                      type="button"
                      className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                      disabled={occupe}
                      onClick={() => changerStatut(sejour, "annulee")}
                    >
                      {t("statut.annulee")}
                    </button>
                  ) : null}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
