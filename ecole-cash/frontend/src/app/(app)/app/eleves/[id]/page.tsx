import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionsEleve } from "@/components/actions-eleve";
import { BoutonAnnulation } from "@/components/bouton-annulation";
import { EtiquetteEcheance, EtiquetteRecu } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { lireOuRien } from "@/lib/api";
import { fcfa, pourcentage, telephoneLocal } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { FicheEleve } from "@/lib/types";

import "../../../../../styles/eleves.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("fiche.meta", langue) };
}

export default async function Fiche({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const langue = await langueServeur();
  const { id } = await params;
  const numero = Number.parseInt(id, 10);
  if (Number.isNaN(numero)) {
    notFound();
  }

  const fiche = await lireOuRien<FicheEleve>(`/eleves/${numero}`);
  if (!fiche) {
    notFound();
  }

  const session = await seanceObligatoire();
  const { eleve, paiements } = fiche;

  return (
    <div className="shell">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="eleve" taille={14} /> {eleve.classe} · {eleve.annee}
          </span>
          <h1 className="display">{eleve.nom_complet}</h1>
          <p className="page-head__lede">
            <span className="mono">{eleve.matricule}</span> ·{" "}
            {eleve.tuteur_nom || t("fiche.parent_non_note", langue)}
            {eleve.tuteur_lien ? ` (${eleve.tuteur_lien})` : ""} ·{" "}
            {eleve.quartier || t("fiche.quartier_non_note", langue)} · {t("fiche.inscrit_le", langue)}{" "}
            {eleve.date_entree}
          </p>
        </div>
        <div className="page-head__aside">
          <span
            className={`tag ${
              eleve.statut === "suspendu"
                ? "tag--cut"
                : eleve.statut === "parti"
                  ? "tag--quiet"
                  : eleve.en_retard
                    ? "tag--late"
                    : "tag--paid"
            }`}
          >
            {eleve.statut_label}
          </span>
          <Link href="/app/eleves" className="btn btn--quiet">
            {t("fiche.toutes", langue)}
          </Link>
        </div>
      </div>

      <div className="fiche-eleve">
        <section className="sheet bloc" aria-label={t("fiche.ardoise", langue)}>
          <div className="section-head">
            <h2>{t("fiche.ardoise", langue)}</h2>
            <span className="section-head__aside">
              {t("fiche.regle", langue, { pct: pourcentage(eleve.du > 0 ? (eleve.rentre / eleve.du) * 100 : 0) })}
            </span>
          </div>

          <div className="fente" style={{ marginTop: "1rem" }}>
            <span
              className="fente__regle"
              style={{ width: `${eleve.du > 0 ? (eleve.rentre / eleve.du) * 100 : 0}%` }}
            />
          </div>

          <div className="ardoise" style={{ marginTop: "1rem" }}>
            {eleve.echeances.map((terme) => (
              <div
                className={`ardoise__terme${
                  terme.statut === "retard"
                    ? " ardoise__terme--retard"
                    : terme.statut === "solde"
                      ? " ardoise__terme--solde"
                      : ""
                }`}
                key={terme.id}
              >
                <span className="ardoise__libelle">
                  {terme.libelle}
                  <small>{terme.due_label}</small>
                </span>
                <span className="ardoise__montant money">
                  {terme.impute > 0 ? t("fiche.posés", langue, { montant: fcfa(terme.impute) }) : ""}
                  {fcfa(terme.montant)}
                </span>
                <EtiquetteEcheance statut={terme.statut} langue={langue} />
              </div>
            ))}
            {eleve.echeances.length === 0 ? (
              <p className="vide-note">
                {eleve.engagement_id === null
                  ? t("fiche.aucune_ardoise", langue, { annee: eleve.annee })
                  : t("fiche.ardoise_non_coupee", langue)}
              </p>
            ) : null}
          </div>

          <div className="compte" style={{ marginTop: "1.4rem" }}>
            <div className="compte__case">
              <p className="compte__valeur money">{fcfa(eleve.du)}</p>
              <span className="compte__legende">{t("fiche.dus_annee", langue)}</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur money">{fcfa(eleve.rentre)}</p>
              <span className="compte__legende">{t("fiche.rentres", langue)}</span>
            </div>
            <div className="compte__case">
              <p className={`compte__valeur money${eleve.reste > 0 ? " compte__valeur--alerte" : ""}`}>
                {fcfa(eleve.reste)}
              </p>
              <span className="compte__legende">{t("fiche.reste_du", langue)}</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur money">
                {eleve.remise > 0 ? fcfa(eleve.remise) : t("fiche.aucune_remise", langue)}
              </p>
              <span className="compte__legende">
                {eleve.remise > 0 ? eleve.motif_remise || t("fiche.remise_accordee", langue) : t("fiche.remise", langue)}
              </span>
            </div>
          </div>

          {eleve.en_retard ? (
            <p className="tiroir__ecart">
              {t("fiche.en_retard", langue, {
                montant: fcfa(eleve.retard_montant),
                n: eleve.jours_retard,
                s: eleve.jours_retard > 1 ? "s" : "",
              })}
              {eleve.motif_statut ? ` ${eleve.motif_statut}.` : ""}
            </p>
          ) : null}

          <hr className="divider divider--ink" style={{ marginBlock: "1.6rem" }} />

          <div className="section-head">
            <h2>{t("fiche.caisse_famille", langue)}</h2>
            <span className="section-head__aside">
              {t("fiche.ecritures", langue, { n: paiements.length, s: paiements.length > 1 ? "s" : "" })}
            </span>
          </div>

          <div className="history">
            {paiements.length === 0 ? (
              <p className="vide-note">
                {t("fiche.rien_encaisse", langue)}
              </p>
            ) : null}
            {paiements.map((paiement) => (
              <div
                className={`history__ligne${paiement.annule ? " history__ligne--annule" : ""}`}
                key={paiement.id}
              >
                <span className="history__heure">
                  {paiement.day}
                  <br />
                  {paiement.clock}
                </span>
                <span className="history__eleve">
                  {paiement.mode_label}
                  <small>
                    {paiement.imputations.length > 0
                      ? paymentImputations(paiement)
                      : t("fiche.sans_imputation", langue)}
                    {paiement.encaisse_par ? ` · ${t("fiche.tenu_par", langue, { nom: paiement.encaisse_par })}` : ""}
                    {paiement.reference ? ` · ${paiement.reference}` : ""}
                    {paiement.note ? ` · ${paiement.note}` : ""}
                  </small>
                </span>
                <span className="ligne-ecolee__valeur money">
                  {fcfa(paiement.montant)}
                </span>
                {paiement.annule ? (
                  <span className="tag tag--quiet">
                    {t("fiche.annule", langue, { motif: paiement.motif_annulation })}
                  </span>
                ) : paiement.recu ? (
                  <span className="history__outils">
                    <Link
                      href={paiement.recu.verif_url}
                      className="text-link"
                      title={paiement.recu.numero}
                    >
                      {paiement.recu.numero}
                    </Link>
                    <EtiquetteRecu statut={paiement.recu.statut} langue={langue} />
                    <BoutonAnnulation paiement={paiement} langue={langue} />
                  </span>
                ) : (
                  <BoutonAnnulation paiement={paiement} langue={langue} />
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="sheet bloc" aria-label={t("fiche.le_parent", langue)}>
          <div className="section-head">
            <h2>{t("fiche.le_parent", langue)}</h2>
            <span className="section-head__aside">
              {eleve.contactable ? t("fiche.joignable", langue) : t("guichet.aucun_numero", langue)}
            </span>
          </div>

          <div className="contact-bloc">
            <div className="contact-bloc__ligne">
              <span>{eleve.tuteur_nom || t("fiche.non_note", langue)}</span>
              {eleve.tuteur_telephone ? (
                <a
                  className="money text-link"
                  href={`tel:${eleve.tuteur_telephone.replace(/\D/g, "")}`}
                >
                  {eleve.tuteur_telephone_display ||
                    telephoneLocal(eleve.tuteur_telephone)}
                </a>
              ) : (
                <span className="vide-note">{t("fiche.a_noter", langue)}</span>
              )}
            </div>
            {eleve.tuteur_second ? (
              <div className="contact-bloc__ligne">
                <span>{t("fiche.secours", langue)}</span>
                <a
                  className="money text-link"
                  href={`tel:${eleve.tuteur_second.replace(/\D/g, "")}`}
                >
                  {eleve.tuteur_second_display || telephoneLocal(eleve.tuteur_second)}
                </a>
              </div>
            ) : null}
          </div>

          {eleve.prochaine ? (
            <>
              <hr className="divider" style={{ marginBlock: "1.2rem" }} />
              <span className="eyebrow">{t("fiche.prochain_terme", langue)}</span>
              <p style={{ marginTop: "0.5rem", fontSize: "0.88rem", fontWeight: 600 }}>
                {eleve.prochaine.libelle} · {fcfa(eleve.prochaine.reste)}
              </p>
              <p className="vide-note">{eleve.prochaine.due_court}</p>
            </>
          ) : null}

          <hr className="divider divider--ink" style={{ marginBlock: "1.4rem" }} />

          <ActionsEleve
            fiche={fiche}
            langue={langue}
            canaux={{
              whatsapp: session.ecole.whatsapp_actif,
              sms: session.ecole.sms_actif,
            }}
          />

          {eleve.note ? (
            <>
              <hr className="divider" style={{ marginBlock: "1.4rem" }} />
              <span className="eyebrow">{t("fiche.observation", langue)}</span>
              <p className="vide-note" style={{ marginTop: "0.5rem" }}>
                {eleve.note}
              </p>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function paymentImputations(paiement: {
  imputations: { libelle: string; montant_label: string }[];
}): string {
  return paiement.imputations
    .map((imputation) => `${imputation.libelle} ${imputation.montant_label}`)
    .join(" · ");
}
