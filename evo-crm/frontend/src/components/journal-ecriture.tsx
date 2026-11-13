"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";
import { formats } from "@/lib/format";
import type { Echange, TypeEchange } from "@/lib/types";

const TYPES: TypeEchange[] = [
  "appel",
  "whatsapp",
  "visite",
  "sms",
  "devis",
  "commande",
  "reclamation",
];

// Un devis et une commande portent une somme ; les autres lignes du journal
// n'en portent jamais. La case montant ne se montre que quand elle a un sens.
const AVEC_MONTANT: TypeEchange[] = ["devis", "commande"];

type Props = {
  clientId: number;
  rappelJours: number;
  langue: string;
};

export function JournalEcriture({ clientId, rappelJours, langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const f = formats(langue);
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState<TypeEchange>("appel");
  const [note, setNote] = useState("");
  const [montant, setMontant] = useState("");
  const [jour, setJour] = useState(f.aujourdhui());
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function joindre() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<{ echange: Echange }>(`/clients/${clientId}/echanges`, {
        body: {
          type,
          note,
          montant: montant === "" ? 0 : Number(montant),
          jour: jour || null,
        },
        langue,
      });
      setNote("");
      setMontant("");
      setOuvert(false);
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        className="cadc-bouton cadc-bouton--premier"
        onClick={() => setOuvert(true)}
      >
        {t("echange.titre")}
      </button>
    );
  }

  return (
    <div className="cadc-pile cadc-pile--serree">
      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("echange.type")}</span>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TypeEchange)}
        >
          {TYPES.map((un) => (
            <option key={un} value={un}>
              {t(`type.${un}`)}
            </option>
          ))}
        </select>
        {type === "devis" ? (
          <span className="cadc-champ__aide">
            {t("echange.aide", { n: rappelJours })}
          </span>
        ) : null}
      </label>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("echange.note")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder={
            langue === "en"
              ? "One line, the way you would say it"
              : "Une ligne, comme tu la dirais au téléphone"
          }
        />
      </label>

      {AVEC_MONTANT.includes(type) ? (
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("echange.montant")}</span>
          <input
            type="number"
            min={0}
            step={500}
            inputMode="numeric"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
          <span className="cadc-champ__aide">{t("echange.montant-aide")}</span>
        </label>
      ) : null}

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("echange.jour")}</span>
        <input type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
      </label>

      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={joindre}
          disabled={enCours}
        >
          {enCours ? t("commun.ecriture") : t("echange.enregistrer")}
        </button>
        <button type="button" className="cadc-bouton" onClick={() => setOuvert(false)}>
          {t("commun.annuler")}
        </button>
      </div>

      {erreur ? (
        <p className="cadc-note cadc-note--rouge" role="status">
          {erreur}
        </p>
      ) : null}
    </div>
  );
}
