"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { traduire } from "@/lib/langue";
import { ecrire } from "@/lib/client-api";
import { ErreurCarnet } from "@/lib/errors";
import { VILLES } from "@/lib/format";
import type { Client, Segment } from "@/lib/types";

const SEGMENTS: Segment[] = ["particulier", "revendeur", "grossiste", "institution"];

type Props = {
  langue: string;
  ville?: string;
};

/**
 * Ouvrir une fiche au comptoir.
 *
 * Le numéro se frappe sans le +237 : la bordure le dit déjà, et un téléphone à
 * touches ne pardonne pas les caractères inutiles.
 */
export function AjoutClient({ langue, ville = "Douala" }: Props) {
  const routeur = useRouter();
  const t = traduire(langue).t;
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [quartier, setQuartier] = useState("");
  const [segment, setSegment] = useState<Segment>("particulier");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const quartiers = VILLES.find((un) => un.nom === ville)?.quartiers ?? [];

  async function ajouter() {
    setEnCours(true);
    setErreur(null);
    try {
      await ecrire<Client>("/clients", {
        body: {
          nom,
          telephone,
          email,
          quartier,
          segment,
          note,
        },
        langue,
      });
      setNom("");
      setTelephone("");
      setQuartier("");
      setEmail("");
      setNote("");
      routeur.refresh();
    } catch (e) {
      setErreur(e instanceof ErreurCarnet ? e.message : t("commun.horsLigne"));
      setEnCours(false);
    }
  }

  return (
    <div className="cadc-pile">
      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.nom")}</span>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={160}
            autoComplete="off"
          />
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.telephone")}</span>
          <span className="cadc-champ__prefixe">
            <span>+237</span>
            <input
              value={telephone}
              onChange={(e) =>
                setTelephone(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))
              }
              inputMode="tel"
              placeholder="6 XX XX XX XX"
              aria-label={t("clients.telephone")}
            />
          </span>
          <span className="cadc-champ__aide">{t("clients.telephone-aide")}</span>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.quartier")}</span>
          <input
            value={quartier}
            onChange={(e) => setQuartier(e.target.value)}
            list="cadc-quartiers-client"
            maxLength={80}
          />
          <datalist id="cadc-quartiers-client">
            {quartiers.map((un) => (
              <option key={un} value={un} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="cadc-grille">
        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.segment")}</span>
          <select value={segment} onChange={(e) => setSegment(e.target.value as Segment)}>
            {SEGMENTS.map((un) => (
              <option key={un} value={un}>
                {t(`segment.${un}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="cadc-champ">
          <span className="cadc-champ__titre">{t("clients.email")}</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={160}
            inputMode="email"
            autoComplete="off"
          />
        </label>
      </div>

      <label className="cadc-champ">
        <span className="cadc-champ__titre">{t("clients.note")}</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder={
            langue === "en"
              ? "Pays cash, comes on Saturdays"
              : "Paye cash, vient le samedi"
          }
        />
        <span className="cadc-champ__aide">{t("clients.note-aide")}</span>
      </label>

      <div className="cadc-acts">
        <button
          type="button"
          className="cadc-bouton cadc-bouton--premier"
          onClick={ajouter}
          disabled={enCours || nom.trim().length < 2}
        >
          {enCours ? t("commun.ecriture") : t("clients.ajouter")}
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
