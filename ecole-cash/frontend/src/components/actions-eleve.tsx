"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ApercuEnvoi } from "@/components/relances-outils";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { canoniseTelephone, fcfa } from "@/lib/format";
import type { Eleve, EnteteRelance, FicheEleve, Relance } from "@/lib/types";

export function ActionsEleve({
  fiche,
  canaux,
}: {
  fiche: FicheEleve;
  canaux: { whatsapp: boolean; sms: boolean };
}) {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { eleve } = fiche;

  async function patcher(corps: Record<string, unknown>, dire: string) {
    setEnCours(true);
    setMessage(null);
    try {
      await ecrire<Eleve>(`/eleves/${eleve.id}`, { method: "PATCH", body: corps });
      setMessage(dire);
      routeur.refresh();
    } catch (erreur) {
      setMessage(erreur instanceof ErreurCaisse ? erreur.message : "Échec.");
    } finally {
      setEnCours(false);
    }
  }

  async function poserEcheances() {
    setEnCours(true);
    setMessage(null);
    try {
      const rendu = await ecrire<{ termes: number; reste: number }>(
        `/eleves/${eleve.id}/echeances`,
        { method: "POST" },
      );
      setMessage(
        `${rendu.termes} termes posés pour ${fcfa(rendu.reste)} à recouvrer.`,
      );
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : "L'échéancier n'a pas pu être posé.",
      );
      setEnCours(false);
    }
  }

  return (
    <div className="form-stack">
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}

      <div className="paire-boutons">
        <Link href={`/app/guichet`} className="btn btn--ink">
          Encaisser cette famille
        </Link>
        <button
          type="button"
          className="btn"
          onClick={poserEcheances}
          disabled={enCours || eleve.engagement_id === null}
          title={
            eleve.engagement_id === null
              ? "Aucune ardoise pour cette année"
              : "Couper le reste dû en tranches"
          }
        >
          {enCours ? "Écriture…" : "Poser l'échéancier"}
        </button>
      </div>

      <div className="paire-boutons">
        <button
          type="button"
          className="btn btn--small"
          onClick={() =>
            patcher({ statut: eleve.statut === "suspendu" ? "suivi" : "suspendu", motif_statut: "Décision de caisse" }, "Statut de la famille mis à jour.")
          }
          disabled={enCours || eleve.statut === "parti"}
        >
          {eleve.statut === "suspendu" ? "Reprendre l'élève" : "Suspendre"}
        </button>
        <button
          type="button"
          className="btn btn--small"
          onClick={() =>
            patcher({ statut: "parti" }, "L'élève est marqué parti : il sort des relances.")
          }
          disabled={enCours || eleve.statut === "parti"}
        >
          Marquer parti
        </button>
      </div>

      <AvisManuel
        eleve={eleve}
        canaux={canaux}
        telephones={fiche.tuteur_telephones}
      />
    </div>
  );
}

function AvisManuel({
  eleve,
  canaux,
  telephones,
}: {
  eleve: Eleve;
  canaux: { whatsapp: boolean; sms: boolean };
  telephones: string[];
}) {
  const routeur = useRouter();
  const [corps, setCorps] = useState(
    eleve.prochaine
      ? `${eleve.tuteur_nom || "Parent"}, la tranche "${eleve.prochaine.libelle}" de ${fcfa(eleve.prochaine.reste)} était attendue le ${eleve.prochaine.due_label}. Merci de passer à la caisse d'ici la fin de la semaine.`
      : "",
  );
  const [canal, setCanal] = useState<"whatsapp" | "sms">(
    canaux.whatsapp ? "whatsapp" : "sms",
  );
  const [palier, setPalier] = useState("2");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const assezLong = corps.trim().length >= 6;

  async function envoyer() {
    setEnCours(true);
    setMessage(null);
    if (!telephones.some((t) => canoniseTelephone(t))) {
      setMessage("Aucun numéro de parent exploitable sur cette fiche.");
      setEnCours(false);
      return;
    }
    const corps_: EnteteRelance = {
      eleve_id: eleve.id,
      palier: Number(palier),
      canal,
      corps: corps.trim(),
    };
    try {
      const rendu = await ecrire<Relance>("/relances", { method: "POST", body: corps_ });
      setMessage(`Avis écrit pour ${rendu.eleve} · ${rendu.telephone_display}.`);
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : "L'avis n'est pas passé.",
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="sheet bloc--serré" style={{ marginTop: "0.4rem" }}>
      <div className="section-head">
        <h2>Avis à la main</h2>
        <span className="section-head__aside">
          {telephones.length} numéro{telephones.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="form-stack" style={{ marginTop: "1rem" }}>
        <div className="field">
          <label htmlFor="avis">Texte de l'avis</label>
          <textarea
            id="avis"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            maxLength={600}
            placeholder="Le message que reçoit le parent…"
          />
          <span className="field__aide">{corps.trim().length} caractères · six au minimum.</span>
        </div>

        <div className="form-grid form-grid--pair">
          <div className="field">
            <label htmlFor="canal">Canal</label>
            <select
              id="canal"
              value={canal}
              onChange={(e) => setCanal(e.target.value as "whatsapp" | "sms")}
            >
              <option value="whatsapp" disabled={!canaux.whatsapp}>
                WhatsApp {canaux.whatsapp ? "" : "(coupé)"}
              </option>
              <option value="sms" disabled={!canaux.sms}>
                SMS {canaux.sms ? "" : "(coupé)"}
              </option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="palier">Palier enregistré</label>
            <select id="palier" value={palier} onChange={(e) => setPalier(e.target.value)}>
              <option value="0">0 · rappel avant</option>
              <option value="1">1 · jour dit</option>
              <option value="2">2 · premier retard</option>
              <option value="3">3 · dernier avis</option>
            </select>
          </div>
        </div>

        <ApercuEnvoi telephones={telephones} canal={canal} />

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--stamp"
            onClick={envoyer}
            disabled={enCours || !assezLong}
          >
            <Icone nom="relance" taille={15} />
            {enCours ? "Écriture…" : "Consigner l'avis"}
          </button>
        </div>

        {message ? (
          <p className="notice" role="status">
            {message}
          </p>
        ) : null}

        <MentionDemo texte="Démo : l'avis est daté du jour et consigné comme envoyé. Aucun message ne sort de la machine." />
      </div>
    </div>
  );
}
