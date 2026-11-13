"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Moyen, Paiement, PaiementEntree, Patient } from "@/lib/types";

type Props = { paiements: Paiement[]; patients: Patient[]; langue: string; responsable: boolean };

const MOYENS: Moyen[] = ["especes", "mtn_money", "orange_money", "nexttel_money", "virement", "assurance", "autre"];

/**
 * La caisse de la clinique : le patient, le montant, le moyen — le reçu
 * sort tout de suite avec son code de dix signes. Annuler ne l'efface pas.
 */
export function EncaisserGerant({ paiements, patients, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [patientId, setPatientId] = useState("");
  const [montant, setMontant] = useState("");
  const [moyen, setMoyen] = useState<Moyen>("especes");
  const [ouvert, setOuvert] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recuFait, setRecuFait] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | "encaisser" | null>(null);

  const patientChoisi = patients.find((un) => String(un.id) === patientId);
  const montantNombre = Number(montant);

  async function encaisser() {
    setEnCours("encaisser");
    setErreur(null);
    try {
      const corps: PaiementEntree = {
        patient_id: Number(patientId),
        montant: montantNombre,
        moyen,
        note: "",
      };
      const paiement = await ecrire<Paiement>("/paiements", { body: corps, langue });
      setRecuFait(paiement.recu);
      setPatientId("");
      setMontant("");
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(null);
    }
  }

  async function annuler(paiement: Paiement) {
    setEnCours(paiement.id);
    setErreur(null);
    try {
      await ecrire<Paiement>(`/paiements/${paiement.id}`, {
        method: "PATCH",
        body: { annule: true },
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
      {recuFait ? (
        <p className="cadc-note cadc-note--vert" role="status">
          {t("caisse.recu")} : <strong>{recuFait}</strong>{" "}
          <a href={`/verifier/${recuFait}`} target="_blank" rel="noreferrer">
            {t("commun.voir")}
          </a>
        </p>
      ) : null}

      <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
        {ouvert ? t("commun.fermer") : t("caisse.nouveau")}
      </button>

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("actes.patient")}</span>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">—</option>
              {patients.filter((un) => un.actif).map((un) => (
                <option key={un.id} value={un.id}>
                  {un.nom} · {un.dus > 0 ? `${t("patients.dus")} ${f.fcfa(un.dus)}` : t("patients.rien")}
                </option>
              ))}
            </select>
          </label>

          {patientChoisi ? (
            <p className="cadc-note cadc-note--acier">
              {patientChoisi.actes} {t("patients.actes")} · {t("patients.dus")} {f.fcfa(patientChoisi.dus)}
            </p>
          ) : null}

          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("caisse.montant")}</span>
              <input
                type="number"
                min={500}
                step={500}
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                placeholder="5000"
              />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("caisse.moyen")}</span>
              <select value={moyen} onChange={(e) => setMoyen(e.target.value as Moyen)}>
                {MOYENS.map((un) => (
                  <option key={un} value={un}>{t(`moyen.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>

          {erreur ? <p className="cadc-note cadc-note--rouge" role="alert">{erreur}</p> : null}

          <div className="cadc-acts">
            <button
              type="button"
              className="cadc-bouton cadc-bouton--premier"
              disabled={enCours !== null || !patientId || !(montantNombre >= 500)}
              onClick={encaisser}
            >
              {enCours === "encaisser" ? t("commun.ecriture") : t("caisse.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {paiements.map((paiement) => (
          <li className={`cadc-ligne${paiement.annule ? " versement--annule" : ""}`} key={paiement.id}>
            <span className="cadc-ligne__nom">
              {paiement.patient}
              <small>
                {f.date(paiement.date)} · {t(`moyen.${paiement.moyen}`)}
                {paiement.acte ? ` · ${paiement.acte}` : ""}
                {paiement.note ? ` · ${paiement.note}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              {f.fcfa(paiement.montant)}
              <br />
              <small>
                <a href={`/verifier/${paiement.recu}`} target="_blank" rel="noreferrer">
                  {paiement.recu}
                </a>
              </small>
              {!paiement.annule && responsable ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === paiement.id}
                    onClick={() => annuler(paiement)}
                  >
                    {t("caisse.annuler")}
                  </button>
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
