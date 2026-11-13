import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionsEleve } from "@/components/actions-eleve";
import { BoutonAnnulation } from "@/components/bouton-annulation";
import { EtiquetteEcheance, EtiquetteRecu } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { lireOuRien } from "@/lib/api";
import { fcfa, pourcentage, telephoneLocal } from "@/lib/format";
import { seanceObligatoire } from "@/lib/session";
import type { FicheEleve } from "@/lib/types";

import "../../../../../styles/eleves.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Famille",
};

export default async function Fiche({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
            {eleve.tuteur_nom || "aucun parent noté"}
            {eleve.tuteur_lien ? ` (${eleve.tuteur_lien})` : ""} ·{" "}
            {eleve.quartier || "quartier non noté"} · inscrit le{" "}
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
            Toutes les familles
          </Link>
        </div>
      </div>

      <div className="fiche-eleve">
        <section className="sheet bloc" aria-label="Ardoise et paiements">
          <div className="section-head">
            <h2>L&apos;ardoise</h2>
            <span className="section-head__aside">
              {pourcentage(eleve.du > 0 ? (eleve.rentre / eleve.du) * 100 : 0)} réglé
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
                  {terme.impute > 0 ? `${fcfa(terme.impute)} posés · ` : ""}
                  {fcfa(terme.montant)}
                </span>
                <EtiquetteEcheance statut={terme.statut} />
              </div>
            ))}
            {eleve.echeances.length === 0 ? (
              <p className="vide-note">
                {eleve.engagement_id === null
                  ? `Aucune ardoise ouverte pour ${eleve.annee}. Engagez la classe ou posez un engagement.`
                  : "Ardoise ouverte mais non coupée en termes."}
              </p>
            ) : null}
          </div>

          <div className="compte" style={{ marginTop: "1.4rem" }}>
            <div className="compte__case">
              <p className="compte__valeur money">{fcfa(eleve.du)}</p>
              <span className="compte__legende">dus sur l&apos;année</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur money">{fcfa(eleve.rentre)}</p>
              <span className="compte__legende">rentrés</span>
            </div>
            <div className="compte__case">
              <p className={`compte__valeur money${eleve.reste > 0 ? " compte__valeur--alerte" : ""}`}>
                {fcfa(eleve.reste)}
              </p>
              <span className="compte__legende">reste dû</span>
            </div>
            <div className="compte__case">
              <p className="compte__valeur money">
                {eleve.remise > 0 ? fcfa(eleve.remise) : "aucune"}
              </p>
              <span className="compte__legende">
                {eleve.remise > 0 ? eleve.motif_remise || "remise accordée" : "remise"}
              </span>
            </div>
          </div>

          {eleve.en_retard ? (
            <p className="tiroir__ecart">
              {fcfa(eleve.retard_montant)} en retard depuis {eleve.jours_retard}{" "}
              jour{eleve.jours_retard > 1 ? "s" : ""}.
              {eleve.motif_statut ? ` ${eleve.motif_statut}.` : ""}
            </p>
          ) : null}

          <hr className="divider divider--ink" style={{ marginBlock: "1.6rem" }} />

          <div className="section-head">
            <h2>Caisse de cette famille</h2>
            <span className="section-head__aside">
              {paiements.length} écriture{paiements.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="history">
            {paiements.length === 0 ? (
              <p className="vide-note">
                Rien n&apos;a encore été encaissé pour cette famille.
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
                      : "sans imputation"}
                    {paiement.encaisse_par ? ` · tenu par ${paiement.encaisse_par}` : ""}
                    {paiement.reference ? ` · ${paiement.reference}` : ""}
                    {paiement.note ? ` · ${paiement.note}` : ""}
                  </small>
                </span>
                <span className="ligne-ecolee__valeur money">
                  {fcfa(paiement.montant)}
                </span>
                {paiement.annule ? (
                  <span className="tag tag--quiet">
                    annulé : {paiement.motif_annulation}
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
                    <EtiquetteRecu statut={paiement.recu.statut} />
                    <BoutonAnnulation paiement={paiement} />
                  </span>
                ) : (
                  <BoutonAnnulation paiement={paiement} />
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="sheet bloc" aria-label="Le parent">
          <div className="section-head">
            <h2>Le parent</h2>
            <span className="section-head__aside">
              {eleve.contactable ? "joignable" : "aucun numéro"}
            </span>
          </div>

          <div className="contact-bloc">
            <div className="contact-bloc__ligne">
              <span>{eleve.tuteur_nom || "non noté"}</span>
              {eleve.tuteur_telephone ? (
                <a
                  className="money text-link"
                  href={`tel:${eleve.tuteur_telephone.replace(/\D/g, "")}`}
                >
                  {eleve.tuteur_telephone_display ||
                    telephoneLocal(eleve.tuteur_telephone)}
                </a>
              ) : (
                <span className="vide-note">à noter</span>
              )}
            </div>
            {eleve.tuteur_second ? (
              <div className="contact-bloc__ligne">
                <span>secours</span>
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
              <span className="eyebrow">Prochain terme</span>
              <p style={{ marginTop: "0.5rem", fontSize: "0.88rem", fontWeight: 600 }}>
                {eleve.prochaine.libelle} · {fcfa(eleve.prochaine.reste)}
              </p>
              <p className="vide-note">{eleve.prochaine.due_court}</p>
            </>
          ) : null}

          <hr className="divider divider--ink" style={{ marginBlock: "1.4rem" }} />

          <ActionsEleve
            fiche={fiche}
            canaux={{
              whatsapp: session.ecole.whatsapp_actif,
              sms: session.ecole.sms_actif,
            }}
          />

          {eleve.note ? (
            <>
              <hr className="divider" style={{ marginBlock: "1.4rem" }} />
              <span className="eyebrow">Observation</span>
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
