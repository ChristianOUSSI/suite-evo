"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Classe, ClasseEntree } from "@/lib/types";

type Props = { classes: Classe[]; langue: string; responsable: boolean };

const VIDE = { nom: "", titulaire: "", frais_annuels: 50000, note: "" };

/**
 * Les classes de l'école : le titulaire, les frais annuels. Le responsable
 * seul y touche — une classe mal nommée est une caisse qui ne rentre pas.
 */
export function ClassesGerant({ classes, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ajout, setAjout] = useState(VIDE);
  const [ouvert, setOuvert] = useState(false);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<number | "ajout" | null>(null);

  async function ajouter() {
    setEnCours("ajout");
    setErreurAjout(null);
    try {
      const corps: ClasseEntree = {
        nom: ajout.nom.trim(),
        titulaire: ajout.titulaire,
        frais_annuels: ajout.frais_annuels,
        note: ajout.note,
      };
      await ecrire<Classe>("/classes", { body: corps, langue });
      setAjout(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreurAjout(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(classe: Classe, patch: Record<string, unknown>) {
    setEnCours(classe.id);
    setErreurs((actuelles) => ({ ...actuelles, [classe.id]: "" }));
    try {
      await ecrire<Classe>(`/classes/${classe.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [classe.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      {responsable ? (
        <div className="cadc-acts">
          <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
            {ouvert ? t("commun.fermer") : t("classes.nouvelle")}
          </button>
        </div>
      ) : null}

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("classes.nom")}</span>
              <input value={ajout.nom} onChange={(e) => setAjout({ ...ajout, nom: e.target.value })} maxLength={80} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("classes.titulaire")}</span>
              <input value={ajout.titulaire} onChange={(e) => setAjout({ ...ajout, titulaire: e.target.value })} maxLength={120} autoComplete="off" />
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("classes.frais")}</span>
              <input type="number" min={0} step={5000} value={ajout.frais_annuels} onChange={(e) => setAjout({ ...ajout, frais_annuels: Number(e.target.value) })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("clients.note")}</span>
              <input value={ajout.note} onChange={(e) => setAjout({ ...ajout, note: e.target.value })} maxLength={600} autoComplete="off" />
            </label>
          </div>
          {erreurAjout ? <p className="cadc-note cadc-note--rouge" role="alert">{erreurAjout}</p> : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" disabled={enCours !== null || ajout.nom.trim().length < 2} onClick={ajouter}>
              {enCours === "ajout" ? t("commun.ecriture") : t("classes.nouvelle")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {classes.map((classe) => (
          <li className={`cadc-ligne${classe.actif ? "" : " ouvrier--sorti"}`} key={classe.id}>
            <span className="cadc-ligne__nom">
              {classe.nom}
              <small>
                {classe.titulaire || "—"}
                {classe.note ? ` · ${classe.note}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <strong>{f.fcfa(classe.frais_annuels)}</strong>
              <br />
              <small>{classe.eleves} {t("classes.eleves")}</small>
              {responsable ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === classe.id}
                    onClick={() => corriger(classe, { actif: !classe.actif })}
                  >
                    {classe.actif ? t("chambres.sortir") : t("chambres.reprendre")}
                  </button>
                </span>
              ) : null}
              {erreurs[classe.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[classe.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
