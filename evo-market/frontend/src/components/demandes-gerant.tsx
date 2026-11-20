"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import type { Demande, StatutDemande } from "@/lib/types";

type Props = { demandes: Demande[]; langue: string };

const LIBELLES: Record<StatutDemande, string> = {
  demande: "demandes.demande",
  confirmee: "demandes.confirmee",
  annulee: "demandes.annulee",
};

const SUIVANTS: Record<StatutDemande, StatutDemande[]> = {
  demande: ["confirmee", "annulee"],
  confirmee: ["demande", "annulee"],
  annulee: ["demande"],
};

/**
 * Les commandes venues de la page publique. La boutique confirme ou
 * annule - la commande interne se crée ensuite en caisse.
 */
export function DemandesGerant({ demandes, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});

  async function trancher(demande: Demande, statut: StatutDemande) {
    setEnCours(demande.id);
    try {
      await ecrire<Demande>(`/demandes/${demande.id}`, {
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
    return <p className="cadc-vide">{t("demandes.vide")}</p>;
  }

  return (
    <ul className="cadc-liste">
      {demandes.map((demande) => (
        <li key={demande.id} className="cadc-carte">
          <div className="cadc-ligne">
            <div>
              <strong>{demande.annonce || t("commander.autre")}</strong>
              <br />
              <small>
                {demande.acheteur_nom} · {demande.quantite} × · {demande.acheteur_telephone}
                {demande.note ? ` · ${demande.note}` : ""}
              </small>
            </div>
            <span className="cadc-badge">{t(LIBELLES[demande.statut])}</span>
          </div>
          {erreurs[demande.id] ? <p className="cadc-erreur">{erreurs[demande.id]}</p> : null}
          <div className="cadc-acts">
            {SUIVANTS[demande.statut].map((statut) => (
              <button
                key={statut}
                type="button"
                className="cadc-bouton"
                disabled={enCours === demande.id}
                onClick={() => trancher(demande, statut)}
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
