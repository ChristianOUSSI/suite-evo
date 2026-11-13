"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Chambre, ChambreEntree, TypeChambre } from "@/lib/types";

type Props = { chambres: Chambre[]; langue: string; responsable: boolean };

const TYPES: TypeChambre[] = ["standard", "deluxe", "suite", "familiale"];
const VIDE = { numero: "", type: "standard" as TypeChambre, prix_par_nuit: 15000, capacite: 2, note: "" };

/**
 * Les chambres de l'hôtel. Le responsable seul y touche : une chambre mal
 * numérotée est une réservation perdue au comptoir.
 */
export function ChambresGerant({ chambres, langue, responsable }: Props) {
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
      const corps: ChambreEntree = {
        numero: ajout.numero.trim(),
        type: ajout.type,
        prix_par_nuit: ajout.prix_par_nuit,
        capacite: ajout.capacite,
        note: ajout.note,
      };
      await ecrire<Chambre>("/chambres", { body: corps, langue });
      setAjout(VIDE);
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreurAjout(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
      setEnCours(null);
    }
  }

  async function corriger(chambre: Chambre, patch: Record<string, unknown>) {
    setEnCours(chambre.id);
    setErreurs((actuelles) => ({ ...actuelles, [chambre.id]: "" }));
    try {
      await ecrire<Chambre>(`/chambres/${chambre.id}`, { method: "PATCH", body: patch, langue });
      routeur.refresh();
    } catch (e) {
      setErreurs((actuelles) => ({
        ...actuelles,
        [chambre.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
      setEnCours(null);
    }
  }

  return (
    <div className="cadc-pile">
      {responsable ? (
        <div className="cadc-acts">
          <button type="button" className="cadc-bouton cadc-bouton--premier" onClick={() => setOuvert((v) => !v)}>
            {ouvert ? t("commun.fermer") : t("chambres.nouvelle")}
          </button>
        </div>
      ) : null}

      {ouvert ? (
        <div className="cadc-carte cadc-pile">
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("chambres.numero")}</span>
              <input value={ajout.numero} onChange={(e) => setAjout({ ...ajout, numero: e.target.value })} maxLength={12} autoComplete="off" />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("chambres.type")}</span>
              <select value={ajout.type} onChange={(e) => setAjout({ ...ajout, type: e.target.value as TypeChambre })}>
                {TYPES.map((un) => (
                  <option key={un} value={un}>{t(`type.${un}`)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cadc-grille">
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("chambres.prix")}</span>
              <input type="number" min={0} step={500} value={ajout.prix_par_nuit} onChange={(e) => setAjout({ ...ajout, prix_par_nuit: Number(e.target.value) })} />
            </label>
            <label className="cadc-champ">
              <span className="cadc-champ__titre">{t("chambres.capacite")}</span>
              <input type="number" min={1} max={10} value={ajout.capacite} onChange={(e) => setAjout({ ...ajout, capacite: Number(e.target.value) })} />
            </label>
          </div>
          <label className="cadc-champ">
            <span className="cadc-champ__titre">{t("clients.note")}</span>
            <input value={ajout.note} onChange={(e) => setAjout({ ...ajout, note: e.target.value })} maxLength={600} />
          </label>
          {erreurAjout ? <p className="cadc-note cadc-note--rouge" role="alert">{erreurAjout}</p> : null}
          <div className="cadc-acts">
            <button type="button" className="cadc-bouton cadc-bouton--premier" disabled={enCours !== null || ajout.numero.trim().length < 1} onClick={ajouter}>
              {enCours === "ajout" ? t("commun.ecriture") : t("chambres.nouvelle")}
            </button>
          </div>
        </div>
      ) : null}

      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {chambres.map((chambre) => (
          <li className={`cadc-ligne${chambre.actif ? "" : " ouvrier--sorti"}`} key={chambre.id}>
            <span className="cadc-ligne__nom">
              {chambre.numero}
              <small>
                {t(`type.${chambre.type}`)} · {f.fcfa(chambre.prix_par_nuit)}/{t("recap.nuits").slice(0, 5)} · {chambre.capacite}{" "}
                {t("chambres.capacite").toLowerCase()}
              </small>
              <small>
                {chambre.sejours} {t("nav.sejours").toLowerCase()}
                {!chambre.actif ? ` · ${t("clients.sans_numero") === "" ? "" : ""}` : ""}
                {chambre.note ? ` · ${chambre.note}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              {chambre.actif ? (
                <span className="cadc-badge cadc-badge--vert">{t("chambres.actives")}</span>
              ) : (
                <span className="cadc-badge cadc-badge--doux">—</span>
              )}
              {responsable ? (
                <span className="cadc-acts">
                  <button
                    type="button"
                    className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                    disabled={enCours === chambre.id}
                    onClick={() => corriger(chambre, { actif: !chambre.actif })}
                  >
                    {chambre.actif ? t("chambres.sortir") : t("chambres.reprendre")}
                  </button>
                </span>
              ) : null}
              {erreurs[chambre.id] ? (
                <span className="cadc-note cadc-note--rouge" role="status">{erreurs[chambre.id]}</span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
