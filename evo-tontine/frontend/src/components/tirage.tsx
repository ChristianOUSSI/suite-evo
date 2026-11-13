"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCercle } from "@/lib/errors";
import { formats } from "@/lib/format";
import type { Tirage as TirageBrut } from "@/lib/types";

type Props = {
  tourId: number;
  gagnant: string | null;
  graine: string;
  dateTirage: string | null;
  taille: number;
  preuve: TirageBrut["verifier"];
  langue: string;
  gestion: boolean;
};

/**
 * Le tirage, et surtout sa preuve.
 *
 * Un nom qui sort d'un écran ne convainc personne au quartier. Ici l'écran
 * rend la graine publique et le rang recalculé : chacun peut refaire le
 * même calcul devant son voisin et tomber sur le même nom.
 */
export function Tirage({
  tourId,
  gagnant,
  graine,
  dateTirage,
  taille,
  preuve,
  langue,
  gestion,
}: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const f = formats(langue);

  async function tirer() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<TirageBrut>(`/tours/${tourId}/tirer`, {
        body: { graine: "" },
        langue,
      });
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCercle ? e.message : t("commun.horsLigne"));
    } finally {
      setEnCours(false);
    }
  }

  if (!gagnant) {
    return (
      <div className="tirage">
        <span className="tirage__etiquette">{t("tour.tirage")}</span>
        <p>{t("tour.en_attente")}</p>
        <p className="tirage__algorithme">{t("tour.tirer-aide")}</p>

        {gestion ? (
          <button
            type="button"
            className="cadc-bouton cadc-bouton--premier cadc-bouton--grand cadc-bouton--large"
            onClick={tirer}
            disabled={enCours}
          >
            <IconeDes />
            {enCours ? t("commun.ecriture") : t("tour.tirer")}
          </button>
        ) : (
          <p className="cadc-note cadc-note--rouge">{t("commun.droitManquant")}</p>
        )}

        {erreur ? (
          <p className="cadc-note cadc-note--rouge" role="status">
            {erreur}
          </p>
        ) : null}
      </div>
    );
  }

  const pareil = preuve !== null && preuve.nom === gagnant;

  return (
    <div className="tirage">
      <span className="tirage__etiquette">{t("tour.gagnant")}</span>
      <p className="tirage__nom">{gagnant}</p>
      {dateTirage ? (
        <p className="tirage__date">
          {t("tour.tire_le")} {f.date(dateTirage)}
        </p>
      ) : null}

      <div className="tirage__preuve">
        <span className="tirage__etiquette">{t("tour.graine")}</span>
        <code className="tirage__graine">{graine}</code>
      </div>

      <div className="tirage__preuve">
        <span className="tirage__etiquette">{t("tour.preuve")}</span>
        <p>
          {t("tour.index")} <strong>{preuve ? preuve.index : "?"}</strong>{" "}
          {t("tour.liste", { n: taille })}
        </p>
        {preuve?.nom ? (
          <p>
            {t("membres.nom")} <strong>{preuve.nom}</strong>
          </p>
        ) : null}
        <p className="tirage__algorithme">{t("tour.algorithme-texte")}</p>
        {pareil ? (
          <p className="cadc-note cadc-note--vert">{t("tour.concorde")}</p>
        ) : (
          <p className="cadc-note cadc-note--rouge">
            {preuve
              ? t("tour.ecart", { index: preuve.index, nom: preuve.nom ?? "?" })
              : t("commun.horsLigne")}
          </p>
        )}
      </div>
    </div>
  );
}

function IconeDes() {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="square"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8.5 8.5h.01" strokeWidth={2.6} />
      <path d="M15.5 8.5h.01" strokeWidth={2.6} />
      <path d="M12 12h.01" strokeWidth={2.6} />
      <path d="M8.5 15.5h.01" strokeWidth={2.6} />
      <path d="M15.5 15.5h.01" strokeWidth={2.6} />
    </svg>
  );
}
