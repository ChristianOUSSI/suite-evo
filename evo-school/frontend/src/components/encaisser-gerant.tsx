"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Eleve, Moyen, Versement, VersementEntree } from "@/lib/types";

type Props = { versements: Versement[]; eleves: Eleve[]; langue: string };

const MOYENS: Moyen[] = ["especes", "mtn_money", "orange_money", "nexttel_money", "virement", "autre"];

/**
 * La caisse des frais : l'élève, le montant, le moyen — le reçu sort tout
 * de suite avec son code de dix signes. Annuler ne l'efface pas.
 */
export function EncaisserGerant({ versements, eleves, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [eleveId, setEleveId] = useState("");
  const [montant, setMontant] = useState("");
  const [moyen, setMoyen] = useState<Moyen>("especes");
  const [ouvert, setOuvert] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [recuFait, setRecuFait] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | "encaisser" | null>(null);

  const eleveChoisi = eleves.find((un) => String(un.id) === eleveId);
  const montantNombre = Number(montant);

  async function encaisser() {
    setEnCours("encaisser");
    setErreur(null);
    try {
      const corps: VersementEntree = {
        eleve_id: Number(eleveId),
        montant: montantNombre,
        moyen,
        note: "",
      };
      const versement = await ecrire<Versement>("/versements", { body: corps, langue });
      setRecuFait(versement.recu);
      setEleveId("");
      setMontant("");
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(null);
    }
  }

  async function annuler(versement: Versement) {
    setEnCours(versement.id);
    setErreur(null);
    try {
      await ecrire<Versement>(`/versements/${versement.id}`, {
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
            <span className="cadc-champ__titre">{t("caisse.eleve")}</span>
            <select value={eleveId} onChange={(e) => setEleveId(e.target.value)}>
              <option value="">—</option>
              {eleves.map((un) => (
                <option key={un.id} value={un.id}>
                  {un.nom} · {un.classe} · {t("eleves.reste")} {f.fcfa(un.reste)}
                </option>
              ))}
            </select>
          </label>

          {eleveChoisi ? (
            <p className="cadc-note cadc-note--acier">
              {t("eleves.paye")} {f.fcfa(eleveChoisi.paye)} · {t("eleves.reste")}{" "}
              {f.fcfa(eleveChoisi.reste)} · {t("eleves.solde")} {f.fcfa(eleveChoisi.solde)}
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
              disabled={enCours !== null || !eleveId || !(montantNombre >= 500)}
              onClick={encaisser}
            >
              {enCours === "encaisser" ? t("commun.ecriture") : t("caisse.nouveau")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {versements.map((versement) => (
          <li className={`cadc-ligne${versement.annule ? " versement--annule" : ""}`} key={versement.id}>
            <span className="cadc-ligne__nom">
              {versement.eleve}
              <small>
                {versement.classe} · {f.date(versement.date)} · {t(`moyen.${versement.moyen}`)}
                {versement.note ? ` · ${versement.note}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              {f.fcfa(versement.montant)}
              <br />
              <small>
                <a href={`/verifier/${versement.recu}`} target="_blank" rel="noreferrer">
                  {versement.recu}
                </a>
              </small>
              {!versement.annule ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === versement.id}
                    onClick={() => annuler(versement)}
                  >
                    {t("caisse.annuler")}
                  </button>
                </span>
              ) : (
                <span className="cadc-badge cadc-badge--doux">—</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
