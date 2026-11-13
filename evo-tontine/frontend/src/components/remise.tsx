"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCercle } from "@/lib/errors";
import { formats } from "@/lib/format";
import type { Remise as RemiseBrute } from "@/lib/types";

type Rail = { code: string; ouvert: boolean };

type Props = {
  tourId: number;
  numero: number;
  statut: string;
  gagnant: string | null;
  montant: number;
  manquantes: number;
  rails: Rail[];
  remise: RemiseBrute | null;
  langue: string;
  gestion: boolean;
};

/**
 * La remise du pot : le moment où l'argent change de main.
 *
 * Deux écrans, jamais un seul qui fait les deux. Avant : un témoin, un rail,
 * une phrase. Après : le code de dix caractères, gros, que le membre garde et
 * peut vérifier sans le téléphone de la trésorière.
 */
export function Remise({
  tourId,
  numero,
  statut,
  gagnant,
  montant,
  manquantes,
  rails,
  remise,
  langue,
  gestion,
}: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [temoin, setTemoin] = useState("");
  const [note, setNote] = useState("");
  const [mode, setMode] = useState(rails.find((un) => un.ouvert)?.code ?? "especes");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const f = formats(langue);

  async function remettre() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<RemiseBrute>(`/tours/${tourId}/remettre`, {
        body: { temoin, mode, note },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCercle ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  if (remise) {
    return (
      <div className="montre">
        <span className="cadc-badge cadc-badge--vert">{t("verif.valide")}</span>
        <p className="tirage__nom">{remise.membre}</p>
        <p className="pot__valeur">{f.fcfa(remise.montant)}</p>

        <div className="montre__preuve">
          <span className="tirage__etiquette">{t("tour.jeton")}</span>
          <code className="montre__code">{remise.jeton}</code>
          <p className="tirage__algorithme">{t("tour.jeton-aide")}</p>
        </div>

        <div className="montre__ligne">
          <span>{t("tour.numero")}</span>
          <strong>{numero}</strong>
        </div>
        <div className="montre__ligne">
          <span>{t("tour.date")}</span>
          <strong>{f.jourDate(remise.jour)}</strong>
        </div>
        <div className="montre__ligne">
          <span>{t("remise.sur")}</span>
          <strong>
            {f.date(remise.moment)} · {t("remise.heure")} {f.heure(remise.moment)}
          </strong>
        </div>
        <div className="montre__ligne">
          <span>{t("tour.mode")}</span>
          <strong>{t(`rail.${remise.mode}`)}</strong>
        </div>
        {remise.temoin ? (
          <div className="montre__ligne">
            <span>{t("remise.temoin")}</span>
            <strong>{remise.temoin}</strong>
          </div>
        ) : null}
        {remise.note ? (
          <div className="montre__ligne">
            <span>{t("tour.note")}</span>
            <strong>{remise.note}</strong>
          </div>
        ) : null}

        <div className="cadc-acts">
          <Link href={`/verif/${remise.jeton}`} className="cadc-bouton cadc-bouton--premier">
            {t("remise.voir")}
          </Link>
          <button type="button" className="cadc-bouton" onClick={() => window.print()}>
            {t("verif.imprimer")}
          </button>
        </div>
      </div>
    );
  }

  if (statut !== "tire" || !gagnant) {
    return <p className="cadc-note">{t("tour.en_attente")}</p>;
  }

  if (!gestion) {
    return <p className="cadc-note">{t("commun.droitManquant")}</p>;
  }

  const portes = rails.filter((un) => un.ouvert);

  return (
    <div className="cadc-pile">
      <p className="cadc-note cadc-note--acier">{t("tour.remettre-aide")}</p>

      <div className="montre__ligne">
        <span>{t("cercle.pot")}</span>
        <strong>{f.fcfa(montant)}</strong>
      </div>

      {manquantes > 0 ? (
        <p className="cadc-note cadc-note--rouge" role="status">
          {t(manquantes === 1 ? "tour.attendre1" : "tour.attendre", { n: manquantes })}
        </p>
      ) : (
        <p className="cadc-note cadc-note--vert">{t("tour.complet")}</p>
      )}

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("tour.temoin")}</span>
        <input
          value={temoin}
          onChange={(e) => setTemoin(e.target.value)}
          maxLength={120}
          placeholder={langue === "en" ? "Who is watching" : "Qui regarde la remise"}
          autoComplete="off"
        />
      </label>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("tour.mode")}</span>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          {portes.map((un) => (
            <option key={un.code} value={un.code}>
              {t(`rail.${un.code}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("tour.note")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={400}
          placeholder={
            langue === "en" ? "A word for the book, if you want" : "Un mot pour le cahier, si tu veux"
          }
        />
      </label>

      <button
        type="button"
        className="cadc-bouton cadc-bouton--premier cadc-bouton--grand cadc-bouton--large"
        onClick={remettre}
        disabled={enCours || manquantes > 0 || portes.length === 0}
      >
        {enCours ? t("commun.ecriture") : t("tour.remettre")}
      </button>

      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
