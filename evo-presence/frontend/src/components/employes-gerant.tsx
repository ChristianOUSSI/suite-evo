"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Employe, EmployeEntree } from "@/lib/types";

type Vide = { nom: string; telephone: string; service: string; note: string };
const VIDE: Vide = { nom: "", telephone: "", service: "", note: "" };

type Props = { employes: Employe[]; langue: string; responsable: boolean };

/**
 * La liste du personnel, et la fiche de chacun.
 * Sortir quelqu'un de la liste n'efface rien : ses journées restent écrites.
 */
export function EmployesGerant({ employes, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [ajout, setAjout] = useState<Vide>(VIDE);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  async function ajouter() {
    setEnCours("ajout");
    setErreurAjout(null);
    try {
      const corps: EmployeEntree = {
        nom: ajout.nom,
        telephone: ajout.telephone ? `+237${ajout.telephone}` : "",
        service: ajout.service,
        note: ajout.note,
      };
      await ecrire<Employe>("/employes", { body: corps, langue });
      setAjout(VIDE);
      routeur.refresh();
    } catch (e) {
      setErreurAjout(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(employe: Employe, patch: Record<string, unknown>) {
    setEnCours(employe.id);
    setErreurs((actuelles) => ({ ...actuelles, [employe.id]: "" }));
    try {
      await ecrire<Employe>(`/employes/${employe.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [employe.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("employes.nom")}</span>
          <input value={ajout.nom} onChange={(e) => setAjout({ ...ajout, nom: e.target.value })} maxLength={160} autoComplete="off" />
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("employes.telephone")}</span>
          <span className="cadc-champ__prefixe">
            <span>+237</span>
            <input
              value={ajout.telephone}
              onChange={(e) => setAjout({ ...ajout, telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })}
              inputMode="tel"
              placeholder="6 XX XX XX XX"
            />
          </span>
          <span className="cadc-champ__aide">{t("employes.telephone-aide")}</span>
        </label>
      </div>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("employes.service")}</span>
          <input value={ajout.service} onChange={(e) => setAjout({ ...ajout, service: e.target.value })} maxLength={60} autoComplete="off" />
          <span className="cadc-champ__aide">{t("employes.service-aide")}</span>
        </label>
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("employes.note")}</span>
          <input value={ajout.note} onChange={(e) => setAjout({ ...ajout, note: e.target.value })} maxLength={600} autoComplete="off" />
        </label>
      </div>

      <div className="cadc-acts">
        <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={ajouter} disabled={enCours !== null || ajout.nom.trim().length < 2}>
          {enCours === "ajout" ? t("commun.ecriture") : t("employes.ajouter")}
        </button>
        {erreurAjout ? <span className="cadc-note cadc-note--rouge" role="status">{erreurAjout}</span> : null}
      </div>

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {employes.map((employe) => (
          <FicheEmploye key={employe.id} employe={employe} responsable={responsable} occupe={enCours === employe.id} erreur={erreurs[employe.id]} onCorriger={(patch) => corriger(employe, patch)} t={t} />
        ))}
      </ul>
    </div>
  );
}

type FicheProps = {
  employe: Employe;
  responsable: boolean;
  occupe: boolean;
  erreur?: string;
  onCorriger: (patch: Record<string, unknown>) => void;
  t: (cle: string, variables?: Record<string, string | number>) => string;
};

function FicheEmploye({ employe, responsable, occupe, erreur, onCorriger, t }: FicheProps) {
  const [ouvert, setOuvert] = useState(false);
  const [champ, setChamp] = useState({
    nom: employe.nom,
    telephone: employe.telephone_display.replace(/^\+?237/, ""),
    service: employe.service,
    note: employe.note,
  });

  function patcher() {
    onCorriger({
      nom: champ.nom,
      telephone: champ.telephone ? `+237${champ.telephone.replace(/[^0-9]/g, "")}` : "",
      service: champ.service,
      note: champ.note,
    });
    setOuvert(false);
  }

  return (
    <li className={`cadc-ligne${employe.actif ? "" : " ouvrier--sorti"}`}>
      <span className="cadc-ligne__nom">
        {employe.nom}
        <small>
          {employe.service || "-"} · {employe.telephone_display || t("employes.sans_numero")}
        </small>
        <small>
          {employe.pointages > 0 ? `${employe.pointages} ${t("commun.pointages")}` : t("employes.jamais_pointe")}
          {!employe.actif ? ` · ${t("employes.sorti")}` : ""}
        </small>
      </span>

      <span className="cadc-acts" style={{ flexWrap: "wrap" }}>
        {responsable || employe.actif ? (
          <button type="button" className="cadc-bouton cadc-bouton--petit" onClick={() => setOuvert((v) => !v)}>
            {ouvert ? t("commun.fermer") : t("commun.voir")}
          </button>
        ) : null}
        {responsable ? (
          <button type="button" className="cadc-bouton cadc-bouton--petit cadc-bouton--doux" disabled={occupe} onClick={() => onCorriger({ actif: !employe.actif })}>
            {employe.actif ? t("employes.sortir") : t("employes.reprendre")}
          </button>
        ) : null}
      </span>

      {ouvert ? (
        <div className="cadc-pile cadc-pile--serree" style={{ flexBasis: "100%" }}>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("employes.nom")}</span>
              <input value={champ.nom} onChange={(e) => setChamp({ ...champ, nom: e.target.value })} maxLength={160} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("employes.telephone")}</span>
              <span className="cadc-champ__prefixe">
                <span>+237</span>
                <input value={champ.telephone} onChange={(e) => setChamp({ ...champ, telephone: e.target.value.replace(/[^0-9]/g, "").slice(0, 9) })} inputMode="tel" placeholder="6 XX XX XX XX" />
              </span>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("employes.service")}</span>
              <input value={champ.service} onChange={(e) => setChamp({ ...champ, service: e.target.value })} maxLength={60} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("employes.note")}</span>
              <input value={champ.note} onChange={(e) => setChamp({ ...champ, note: e.target.value })} maxLength={600} />
            </label>
          </div>
          <p className="cadc-champ__aide">{t("employes.sortir-aide")}</p>
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" disabled={occupe || champ.nom.trim().length < 2} onClick={patcher}>
              {occupe ? t("commun.ecriture") : t("commun.enregistrer")}
            </button>
            {erreur ? <span className="cadc-note cadc-note--rouge" role="status">{erreur}</span> : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
