"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { RendezVous, RendezVousStatut } from "@/lib/types";

type Props = { rendezVous: RendezVous[]; langue: string };

const LIBELLES: Record<RendezVousStatut, string> = {
  demande: "rdvs.demande",
  confirme: "rdvs.confirme",
  refuse: "rdvs.refuse",
  fait: "rdvs.fait",
};

const SUIVANTS: Record<RendezVousStatut, RendezVousStatut[]> = {
  demande: ["confirme", "refuse"],
  confirme: ["fait", "refuse"],
  refuse: ["demande"],
  fait: ["confirme"],
};

/**
 * Les rendez-vous venus de la page publique. La clinique confirme, refuse
 * ou marque fait - la consultation se consigne ensuite comme un acte.
 */
export function RendezVousGerant({ rendezVous, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});

  async function trancher(rdv: RendezVous, statut: RendezVousStatut) {
    setEnCours(rdv.id);
    try {
      await ecrire<RendezVous>(`/rendez-vous/${rdv.id}`, {
        body: { statut },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreurs((avant) => ({
        ...avant,
        [rdv.id]: e instanceof ErreurChantier ? e.message : t("commun.horsLigne"),
      }));
    } finally {
      setEnCours(null);
    }
  }

  if (rendezVous.length === 0) {
    return <p className="cadc-vide">{t("rdvs.vide")}</p>;
  }

  return (
    <ul className="cadc-liste">
      {rendezVous.map((rdv) => (
        <li key={rdv.id} className="cadc-carte">
          <div className="cadc-ligne">
            <div>
              <strong>{rdv.nom}</strong>
              {rdv.motif ? ` · ${rdv.motif}` : ""}
              <br />
              <small>
                {rdv.jour}
                {rdv.heure ? ` ${rdv.heure}` : ""} · {rdv.telephone_display}
                {rdv.note ? ` · ${rdv.note}` : ""}
              </small>
            </div>
            <span className="cadc-badge">{t(LIBELLES[rdv.statut])}</span>
          </div>
          {erreurs[rdv.id] ? <p className="cadc-erreur">{erreurs[rdv.id]}</p> : null}
          <div className="cadc-acts">
            {SUIVANTS[rdv.statut].map((statut) => (
              <button
                key={statut}
                type="button"
                className="cadc-bouton"
                disabled={enCours === rdv.id}
                onClick={() => trancher(rdv, statut)}
              >
                {t(LIBELLES[statut])}
              </button>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
