"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Demande } from "@/lib/types";

type Props = { demandes: Demande[]; langue: string; responsable: boolean };

const LIBELLES: Record<Demande["statut"], string> = {
  demandee: "inscriptions.demandee",
  inscrit: "inscriptions.inscrit",
  refuse: "inscriptions.refuse",
};

/**
 * Les demandes d'inscription venues de la page publique. Le responsable
 * marque « inscrit » ou « refuse » - la fiche élève se crée ensuite à la
 * main pour garder le matricule propre.
 */
export function InscriptionsGerant({ demandes, langue, responsable }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});

  async function trancher(demande: Demande, statut: Demande["statut"]) {
    if (statut === demande.statut) return;
    setEnCours(demande.id);
    try {
      await ecrire<Demande>(`/inscriptions/${demande.id}`, {
        body: { statut },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreurs((avant) => ({
        ...avant,
        [demande.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
    } finally {
      setEnCours(null);
    }
  }

  if (demandes.length === 0) {
    return <p className="cadc-vide">{t("inscriptions.vide")}</p>;
  }

  return (
    <ul className="cadc-liste">
      {demandes.map((demande) => (
        <li key={demande.id} className="cadc-carte">
          <div className="cadc-ligne">
            <div>
              <strong>{demande.eleve_nom}</strong>
              {demande.parent_nom ? ` · ${demande.parent_nom}` : ""}
              {demande.classe ? ` · ${demande.classe}` : ""}
              <br />
              <small>
                {demande.telephone_display}
                {demande.note ? ` · ${demande.note}` : ""}
              </small>
            </div>
            <span className="cadc-badge">{t(LIBELLES[demande.statut])}</span>
          </div>
          {erreurs[demande.id] ? <p className="cadc-erreur">{erreurs[demande.id]}</p> : null}
          {responsable && demande.statut === "demandee" ? (
            <div className="cadc-acts">
              <button
                type="button"
                className="cadc-bouton cadc-bouton--premier"
                disabled={enCours === demande.id}
                onClick={() => trancher(demande, "inscrit")}
              >
                {t("inscriptions.inscrit")}
              </button>
              <button
                type="button"
                className="cadc-bouton"
                disabled={enCours === demande.id}
                onClick={() => trancher(demande, "refuse")}
              >
                {t("inscriptions.refuse")}
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
