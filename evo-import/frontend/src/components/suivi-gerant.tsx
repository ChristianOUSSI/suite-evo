"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { formats } from "@/lib/format";
import { ecrire } from "@/lib/client-api";
import { traduire } from "@/lib/langue";
import type { Envoi } from "@/lib/types";

/**
 * La page publique du quai : le destinataire tape le numéro de suivi à
 * dix signes et lit le parcours - sans compte, sans appel.
 */
export function SuiviGerant({ langue }: { langue: string }) {
  const t = traduire(langue).t;
  const f = formats(langue);
  const params = useSearchParams();
  const initial = params.get("numero") ?? "";
  const [numero, setNumero] = useState(initial);
  const [envoi, setEnvoi] = useState<Envoi | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function chercher(valeur?: string) {
    const n = (valeur ?? numero).trim();
    if (!n) return;
    setEnCours(true);
    setIntrouvable(false);
    setEnvoi(null);
    try {
      const corps = await ecrire<Envoi>(`/public/suivi/${encodeURIComponent(n)}`, { method: "GET", langue });
      setEnvoi(corps);
      setNumero(n);
    } catch {
      setIntrouvable(true);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-pile">
      <form
        className="cadc-grille"
        onSubmit={(e) => {
          e.preventDefault();
          void chercher();
        }}
      >
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("suivi.numero")}</span>
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value.toUpperCase())}
            maxLength={16}
            autoComplete="off"
            placeholder="EVIO-…"
          />
        </label>
        <div className="cadc-acts" style={{ alignItems: "flex-end" }}>
          <button type="submit" className="cadc-bouton cadc-bouton--premier" disabled={enCours || !numero.trim()}>
            {enCours ? t("commun.ecriture") : t("suivi.chercher")}
          </button>
        </div>
      </form>

      {introuvable ? (
        <span className="cadc-note cadc-note--rouge" role="status">{t("suivi.introuvable")}</span>
      ) : null}

      {envoi ? (
        <div className="cadc-pile">
          <section className="cadc-carte">
            <div className="cadc-tete">
              <h2>{envoi.description}</h2>
              <span className="cadc-badge cadc-badge--acier">{t(`statut.${envoi.statut}`)}</span>
            </div>
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{envoi.numero_suivi}</span>
                <span className="cadc-ligne__valeur">{t(`mode.${envoi.mode}`)}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.de")}</span>
                <span className="cadc-ligne__valeur">{envoi.expéditeur_pays || envoi.expéditeur_nom}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.vers")}</span>
                <span className="cadc-ligne__valeur">{envoi.destinataire_ville || envoi.destinataire_nom}</span>
              </li>
              <li className="cadc-ligne">
                <span className="cadc-ligne__nom">{t("suivi.date_envoi")}</span>
                <span className="cadc-ligne__valeur">{f.jourDate(envoi.date_envoi)}</span>
              </li>
              {envoi.date_livraison ? (
                <li className="cadc-ligne">
                  <span className="cadc-ligne__nom">{t("suivi.date_livraison")}</span>
                  <span className="cadc-ligne__valeur">{f.jourDate(envoi.date_livraison)}</span>
                </li>
              ) : null}
              {envoi.poids_kg > 0 ? (
                <li className="cadc-ligne">
                  <span className="cadc-ligne__nom">{t("envois.poids")}</span>
                  <span className="cadc-ligne__valeur">{envoi.poids_kg} {t("envois.kg")}</span>
                </li>
              ) : null}
            </ul>
            {envoi.transitaire ? (
              <p className="cadc-note cadc-note--acier" style={{ marginTop: 12 }}>
                {envoi.transitaire.nom} · {envoi.transitaire.telephone_display}
              </p>
            ) : null}
          </section>

          <section className="cadc-carte" aria-label={t("suivi.parcours")}>
            <div className="cadc-tete">
              <h2>{t("suivi.parcours")}</h2>
            </div>
            <ul className="cadc-liste cadc-pile cadc-pile--serree">
              {envoi.suivi.map((ligne) => (
                <li className="cadc-ligne" key={ligne.id}>
                  <span className="cadc-ligne__nom">
                    {t(`statut.${ligne.statut}`)}
                    {ligne.note ? <small>{ligne.note}</small> : null}
                  </span>
                  <span className="cadc-ligne__valeur">{f.jourDate(ligne.cree_le)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
