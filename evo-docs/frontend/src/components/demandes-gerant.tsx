"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ecrire } from "@/lib/client-api";
import { ErreurChantier } from "@/lib/errors";
import { formats } from "@/lib/format";
import { traduire } from "@/lib/langue";
import type { Demande, StatutDemande } from "@/lib/types";

type Props = { demandes: Demande[]; langue: string; peutGerer: boolean };

const SUIVANTS: Record<StatutDemande, StatutDemande[]> = {
  demandee: ["prete", "refusee"],
  prete: ["remise", "refusee"],
  remise: [],
  refusee: ["demandee"],
};

/**
 * Les demandes venues de la page publique : le registre des papers à
 * préparer. Le statut suit le papier - demandée, prête, remise, refusée.
 */
export function DemandesGerant({ demandes, langue, peutGerer }: Props) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const routeur = useRouter();
  const [enCours, setEnCours] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changer(demande: Demande, statut: StatutDemande) {
    setEnCours(demande.id);
    setErreur(null);
    try {
      await ecrire<Demande>(`/demandes/${demande.id}`, {
        method: "PATCH",
        body: { statut },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurChantier ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(null);
    }
  }

  if (demandes.length === 0) {
    return <p className="cadc-note">{t("demande.vide")}</p>;
  }

  return (
    <div className="cadc-pile">
      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          {erreur}
        </p>
      ) : null}
      <ul className="cadc-liste cadc-pile cadc-pile--serree">
        {demandes.map((demande) => (
          <li className="cadc-ligne" key={demande.id}>
            <span className="cadc-ligne__nom">
              #{demande.id} · {demande.nom}
              <small>
                {demande.telephone_display ? `${demande.telephone_display} · ` : ""}
                {t(`categorie.${demande.categorie}`)} · {f.date(demande.cree_le)} {f.heure(demande.cree_le)}
                {demande.motif ? ` · ${demande.motif}` : ""}
                {demande.note ? ` · ${demande.note}` : ""}
              </small>
            </span>
            <span className="cadc-ligne__valeur">
              <span className={`cadc-badge ${demande.statut === "demandee" ? "cadc-badge--acier" : demande.statut === "remise" ? "cadc-badge--vert" : "cadc-badge--doux"}`}>
                {t(`statutdemande.${demande.statut}`)}
              </span>
              {peutGerer && SUIVANTS[demande.statut].length > 0 ? (
                <span className="cadc-acts">
                  {SUIVANTS[demande.statut].map((suivant) => (
                    <button
                      key={suivant}
                      type="button"
                      className="cadc-bouton cadc-bouton--petit cadc-bouton--doux"
                      disabled={enCours === demande.id}
                      onClick={() => changer(demande, suivant)}
                    >
                      {suivant === "prete"
                        ? t("demandes.prete")
                        : suivant === "remise"
                          ? t("demandes.remise")
                          : t("demandes.refusee")}
                    </button>
                  ))}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
