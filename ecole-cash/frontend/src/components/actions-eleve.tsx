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
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { Eleve, EnteteRelance, FicheEleve, Relance } from "@/lib/types";

export function ActionsEleve({
  fiche,
  canaux,
  langue = LANGUE_DEFAUT,
}: {
  fiche: FicheEleve;
  canaux: { whatsapp: boolean; sms: boolean };
  langue?: Langue;
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
      setMessage(erreur instanceof ErreurCaisse ? erreur.message : t("act.echec", langue));
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
        t("act.termes_posés", langue, {
          n: rendu.termes,
          montant: fcfa(rendu.reste),
        }),
      );
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : t("act.echeancier_refuse", langue),
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
          {t("act.encaisser", langue)}
        </Link>
        <button
          type="button"
          className="btn"
          onClick={poserEcheances}
          disabled={enCours || eleve.engagement_id === null}
          title={
            eleve.engagement_id === null
              ? t("act.aucune_ardoise", langue)
              : t("act.couper_tranches", langue)
          }
        >
          {enCours ? t("act.ecriture", langue) : t("act.poser_echeancier", langue)}
        </button>
      </div>

      <div className="paire-boutons">
        <button
          type="button"
          className="btn btn--small"
          onClick={() =>
            patcher(
              {
                statut: eleve.statut === "suspendu" ? "suivi" : "suspendu",
                motif_statut: t("act.motif_statut", langue),
              },
              t("act.statut_ok", langue),
            )
          }
          disabled={enCours || eleve.statut === "parti"}
        >
          {eleve.statut === "suspendu" ? t("act.reprendre", langue) : t("act.suspendre", langue)}
        </button>
        <button
          type="button"
          className="btn btn--small"
          onClick={() =>
            patcher({ statut: "parti" }, t("act.parti_ok", langue))
          }
          disabled={enCours || eleve.statut === "parti"}
        >
          {t("act.marquer_parti", langue)}
        </button>
      </div>

      <AvisManuel
        eleve={eleve}
        canaux={canaux}
        telephones={fiche.tuteur_telephones}
        langue={langue}
      />
    </div>
  );
}

function AvisManuel({
  eleve,
  canaux,
  telephones,
  langue,
}: {
  eleve: Eleve;
  canaux: { whatsapp: boolean; sms: boolean };
  telephones: string[];
  langue: Langue;
}) {
  const routeur = useRouter();
  const [corps, setCorps] = useState(
    eleve.prochaine
      ? t("avis.modele", langue, {
          tuteur: eleve.tuteur_nom || t("avis.parent", langue),
          libelle: eleve.prochaine.libelle,
          montant: fcfa(eleve.prochaine.reste),
          date: eleve.prochaine.due_label,
        })
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
      setMessage(t("avis.aucun_numero", langue));
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
      setMessage(
        t("avis.ecrit", langue, { eleve: rendu.eleve, tel: rendu.telephone_display }),
      );
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse ? erreur.message : t("avis.refuse", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="sheet bloc--serré" style={{ marginTop: "0.4rem" }}>
      <div className="section-head">
        <h2>{t("avis.titre", langue)}</h2>
        <span className="section-head__aside">
          {t("avis.numeros", langue, { n: telephones.length, s: telephones.length > 1 ? "s" : "" })}
        </span>
      </div>

      <div className="form-stack" style={{ marginTop: "1rem" }}>
        <div className="field">
          <label htmlFor="avis">{t("avis.texte", langue)}</label>
          <textarea
            id="avis"
            value={corps}
            onChange={(e) => setCorps(e.target.value)}
            maxLength={600}
            placeholder={t("avis.placeholder", langue)}
          />
          <span className="field__aide">
            {t("avis.compteurs", langue, { n: corps.trim().length })}
          </span>
        </div>

        <div className="form-grid form-grid--pair">
          <div className="field">
            <label htmlFor="canal">{t("avis.canal", langue)}</label>
            <select
              id="canal"
              value={canal}
              onChange={(e) => setCanal(e.target.value as "whatsapp" | "sms")}
            >
              <option value="whatsapp" disabled={!canaux.whatsapp}>
                WhatsApp {canaux.whatsapp ? "" : t("avis.coupe", langue)}
              </option>
              <option value="sms" disabled={!canaux.sms}>
                SMS {canaux.sms ? "" : t("avis.coupe", langue)}
              </option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="palier">{t("avis.palier", langue)}</label>
            <select id="palier" value={palier} onChange={(e) => setPalier(e.target.value)}>
              <option value="0">{t("avis.palier0", langue)}</option>
              <option value="1">{t("avis.palier1", langue)}</option>
              <option value="2">{t("avis.palier2", langue)}</option>
              <option value="3">{t("avis.palier3", langue)}</option>
            </select>
          </div>
        </div>

        <ApercuEnvoi telephones={telephones} canal={canal} langue={langue} />

        <div className="form-actions">
          <button
            type="button"
            className="btn btn--stamp"
            onClick={envoyer}
            disabled={enCours || !assezLong}
          >
            <Icone nom="relance" taille={15} />
            {enCours ? t("act.ecriture", langue) : t("avis.consigner", langue)}
          </button>
        </div>

        {message ? (
          <p className="notice" role="status">
            {message}
          </p>
        ) : null}

        <MentionDemo texte={t("avis.demo", langue)} langue={langue} />
      </div>
    </div>
  );
}
