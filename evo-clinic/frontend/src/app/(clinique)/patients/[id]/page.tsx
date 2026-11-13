import type { Metadata } from "next";
import Link from "next/link";

import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { Patient } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Patient file" : "La fiche patient" };
}

export default async function PagePatient({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { id } = await params;

  const patient = await lire<Patient>(`/patients/${id}`, langue);

  return (
    <div className="cadc-gabarit clinique">
      <div className="clinique__tete">
        <span className="cadc-badge cadc-badge--acier">{t("patients.detail")}</span>
        <h1>{patient.nom}</h1>
        <p>
          {patient.groupe ? `${t("patients.groupe")} ${patient.groupe}` : ""}
          {patient.sexe ? ` · ${patient.sexe}` : ""}
          {patient.naissance ? ` · ${f.date(patient.naissance)}` : ""}
          {patient.telephone_display ? ` · ${patient.telephone_display}` : ""}
        </p>
      </div>

      {patient.allergies ? (
        <p className="cadc-note cadc-note--rouge" role="alert">
          ⚠ {t("patients.allergies")} : {patient.allergies}
        </p>
      ) : null}
      {patient.note ? <p className="cadc-note">{patient.note}</p> : null}

      <div className="portails">
        <div className="portail" aria-label={t("patients.dus")}>
          <span>
            <strong
              style={{
                display: "block",
                fontFamily: "var(--cadc-mono)",
                fontSize: "clamp(1.9rem,8vw,2.8rem)",
                lineHeight: 1.1,
              }}
            >
              {f.fcfa(patient.dus)}
            </strong>
            <span className="cadc-champ__aide">{t("patients.dus")}</span>
          </span>
        </div>
      </div>

      <div className="cadc-acts">
        <Link href="/caisse" className="cadc-bouton cadc-bouton--grand cadc-bouton--premier">
          {t("accueil.encaisser")}
        </Link>
        <Link href="/actes" className="cadc-bouton cadc-bouton--doux">
          {t("accueil.consulter")}
        </Link>
      </div>

      <section className="cadc-carte" aria-label={t("nav.actes")}>
        <div className="cadc-tete">
          <h2>{t("nav.actes")}</h2>
          <span className="cadc-tete__cote">{patient.actes_liste?.length ?? 0}</span>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {(patient.actes_liste ?? []).map((acte) => (
            <li className={`cadc-ligne${acte.annule ? " ouvrier--sorti" : ""}`} key={acte.id}>
              <span className="cadc-ligne__nom">
                {acte.motif}
                <small>
                  {f.jourDate(acte.date)}
                  {acte.diagnostic ? ` · ${acte.diagnostic}` : ""}
                  {acte.traitement ? ` · ${acte.traitement}` : ""}
                </small>
              </span>
              <span className="cadc-ligne__valeur">
                {f.fcfa(acte.montant)}
                {acte.annule ? <span className="cadc-badge cadc-badge--rouge">{t("actes.annule")}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="cadc-carte" aria-label={t("nav.caisse")}>
        <div className="cadc-tete">
          <h2>{t("nav.caisse")}</h2>
          <span className="cadc-tete__cote">{patient.paiements_liste?.length ?? 0}</span>
        </div>
        <ul className="cadc-liste cadc-pile cadc-pile--serree">
          {(patient.paiements_liste ?? []).map((paiement) => (
            <li className={`cadc-ligne${paiement.annule ? " versement--annule" : ""}`} key={paiement.id}>
              <span className="cadc-ligne__nom">
                {f.date(paiement.date)} · {t(`moyen.${paiement.moyen}`)}
                <small>
                  <a href={`/verifier/${paiement.recu}`} target="_blank" rel="noreferrer">
                    {paiement.recu}
                  </a>
                  {paiement.acte ? ` · ${paiement.acte}` : ""}
                </small>
              </span>
              <span className="cadc-ligne__valeur">{f.fcfa(paiement.montant)}</span>
            </li>
          ))}
        </ul>
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
