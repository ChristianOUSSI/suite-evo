"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCercle } from "@/lib/errors";

type Props = {
  langue: string;
};

/**
 * Ajouter une tête au cercle.
 *
 * Le numéro se frappe sans le +237 : la bordure le dit déjà, et un vieux
 * téléphone à touches ne pardonne pas les caractères inutiles.
 */
export function AjoutMembre({ langue }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [part, setPart] = useState("1");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function ajouter() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire("/membres", {
        body: { nom, telephone, part: Number(part), note },
        langue,
      });
      setNom("");
      setTelephone("");
      setPart("1");
      setNote("");
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCercle ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("membres.nom")}</span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={120}
            autoComplete="off"
            aria-invalid={erreur !== null && nom.length < 2 ? "true" : undefined}
          />
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("membres.telephone")}</span>
          <span className="cadc-champ__prefixe">
            <span>+237</span>
            <input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
              inputMode="tel"
              placeholder="6 XX XX XX XX"
              aria-label={t("membres.telephone")}
            />
          </span>
          <span className="cadc-champ__aide">{t("membres.telephone-aide")}</span>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("membres.part")}</span>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={part}
            onChange={(e) => setPart(e.target.value)}
          />
          <span className="cadc-champ__aide">{t("membres.part-aide")}</span>
        </label>
      </div>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("tour.note")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={400}
          placeholder={
            langue === "en"
              ? "Two heads to feed, one market stall"
              : "Deux têtes à nourrir, un bangue au marché"
          }
        />
      </label>

      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={ajouter}
          disabled={enCours || nom.trim().length < 2}
        >
          {enCours ? t("commun.ecriture") : t("membres.ajouter")}
        </button>
        {erreur ? (
          <span className="cadc-note cadc-note--rouge" role="status">
            {erreur}
          </span>
        ) : null}
      </div>
    </div>
  );
}
