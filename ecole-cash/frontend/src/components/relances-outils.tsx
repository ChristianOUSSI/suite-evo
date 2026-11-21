"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icone } from "@/components/icone";
import { MentionDemo } from "@/components/mention-demo";
import { ecrire } from "@/lib/client-api";
import { ErreurCaisse } from "@/lib/errors";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";
import type { EnvoiTest, Recu, Relance } from "@/lib/types";

export function ApercuEnvoi({
  telephones,
  canal,
  langue = LANGUE_DEFAUT,
}: {
  telephones: string[];
  canal: "whatsapp" | "sms";
  langue?: Langue;
}) {
  const [canonique, setCanonique] = useState(telephones[0] ?? "");
  const [apercu, setApercu] = useState<EnvoiTest | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function demander() {
    setEnCours(true);
    setMessage(null);
    try {
      const rendu = await ecrire<EnvoiTest>("/paiements/apercu", {
        method: "POST",
        body: { canal, a: canonique, texte: "" },
      });
      setApercu(rendu);
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : t("outils.apercu_refuse", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="sheet bloc--serré apercu">
      <div className="section-head">
        <h2>{t("outils.verifier_numero", langue)}</h2>
        <span className="section-head__aside">
          {t("outils.numeros_inscrits", langue, {
            n: telephones.length,
            s: telephones.length > 1 ? "s" : "",
          })}
        </span>
      </div>

      <div className="field">
        <label htmlFor="aperu-numero">{t("outils.numero_tester", langue)}</label>
        <select
          id="aperu-numero"
          value={canonique}
          onChange={(e) => setCanonique(e.target.value)}
        >
          {telephones.length === 0 ? <option value="">{t("outils.aucun_numero", langue)}</option> : null}
          {telephones.map((numero) => (
            <option key={numero} value={numero}>
              {numero}
            </option>
          ))}
        </select>
        <span className="field__aide">
          {t("outils.garde_fou", langue)}
        </span>
      </div>

      {message ? (
        <p className="notice notice--error" role="alert">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        className="btn btn--small"
        onClick={demander}
        disabled={enCours || canonique === ""}
      >
        <Icone nom="recu" taille={15} />
        {enCours ? t("outils.lecture", langue) : t("outils.voir_apercu", langue)}
      </button>

      {apercu ? (
        <div className="reçu-sortie__corps">{apercu.message}</div>
      ) : null}

      <MentionDemo texte={t("outils.apercu_demo", langue)} langue={langue} />
    </div>
  );
}

export function BoutonRenvoi({
  recu,
  langue = LANGUE_DEFAUT,
}: {
  recu: Recu;
  langue?: Langue;
}) {
  const routeur = useRouter();
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function renvoyer() {
    setEnCours(true);
    setMessage(null);
    try {
      const rendu = await ecrire<Recu>(`/recus/${recu.id}/renvoyer`, {
        method: "POST",
      });
      setMessage(t("outils.renvoi_fait", langue, { ref: rendu.reference }));
      routeur.refresh();
    } catch (erreur) {
      setMessage(
        erreur instanceof ErreurCaisse
          ? erreur.message
          : t("outils.renvoi_refuse", langue),
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <span className="annulation">
      <button
        type="button"
        className="btn btn--small btn--quiet"
        onClick={renvoyer}
        disabled={enCours}
      >
        {enCours ? "…" : t("outils.renvoyer", langue)}
      </button>
      {message ? <span className="annulation__note">{message}</span> : null}
    </span>
  );
}

export function RelanceLigne({ relance, rang }: { relance: Relance; rang: number }) {
  const due = !relance.envoyee && !relance.annulee;
  return (
    <div
      className={`relance-ligne${
        relance.annulee
          ? " relance-ligne--morte"
          : relance.envoyee
            ? " relance-ligne--faite"
            : due
              ? " relance-ligne--due"
              : ""
      }`}
    >
      <span className="palier" aria-hidden="true">
        {String(rang).padStart(2, "0")}
      </span>
      <span className="relance-ligne__qui">
        <a
          href={`/app/eleves/${relance.eleve_id}`}
          className="text-link"
          style={{ color: "inherit", fontWeight: 600 }}
        >
          {relance.eleve}
        </a>
        <small>
          {relance.classe} · {relance.tuteur} · {relance.telephone_display}
        </small>
      </span>
      <span className="relance-ligne__texte">{relance.corps}</span>
      <span className="relance-ligne__date">
        {relance.programme_label}
        <small>
          {relance.statut_label}
          {relance.envoyee_le ? ` · ${relance.reference}` : ""}
        </small>
      </span>
      <span className={`tag ${due ? "tag--late" : relance.envoyee ? "tag--paid" : "tag--quiet"}`}>
        {relance.canal_label}
      </span>
    </div>
  );
}
