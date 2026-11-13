import type { Metadata } from "next";
import Link from "next/link";

import { Icone } from "@/components/icone";
import { PilotageRelances } from "@/components/pilotage-relances";
import { RelanceLigne } from "@/components/relances-outils";
import { lire } from "@/lib/api";
import { parametres } from "@/lib/client-api";
import { seanceObligatoire } from "@/lib/session";
import type { ListeRelances } from "@/lib/types";

import "../../../../styles/relances.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Relances",
};

const ETATS = [
  { cle: "", label: "Tout" },
  { cle: "filees", label: "Dans la file" },
  { cle: "envoyees", label: "Remis" },
  { cle: "annulees", label: "Devenus inutiles" },
];

export default async function Relances({
  searchParams,
}: {
  searchParams: Promise<{ etat?: string }>;
}) {
  const filtre = await searchParams;
  const etat = filtre.etat ?? "";

  const [liste, session] = await Promise.all([
    lire<ListeRelances>(`/relances${parametres({ etat, limite: 400 })}`),
    seanceObligatoire(),
  ]);

  const dues = liste.relances.filter(
    (relance) => !relance.envoyee && !relance.annulee,
  );

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="relance" taille={14} />
            {session.ecole.ton === "ferme" ? "Ton ferme" : "Ton courtois"} ·{" "}
            rappel {session.ecole.relance_avance} j avant, suspension à{" "}
            {session.ecole.tolerance_retard} j
          </span>
          <h1 className="display">Les relances</h1>
          <p className="page-head__lede">
            {liste.total} avis au carnet, {liste.a_envoyer} à écrire aujourd&apos;hui.
            Un avis déjà consigné ne repart pas deux fois : le lancement annule
            aussi ceux devenus inutiles après un paiement.
          </p>
        </div>
        <div className="page-head__aside">
          <Link href="/app/guichet" className="btn btn--ink">
            Encaisser avant de relancer
          </Link>
        </div>
      </div>

      <PilotageRelances
        aEnvoyer={liste.a_envoyer}
        canaux={{
          whatsapp: session.ecole.whatsapp_actif,
          sms: session.ecole.sms_actif,
        }}
      />

      <nav className="bande-filtre" aria-label="File d'attente">
        {ETATS.map((case_) => (
          <Link
            key={case_.cle || "tout"}
            href={`/app/relances${parametres({ etat: case_.cle })}`}
            className={case_.cle === etat ? "is-active" : undefined}
            aria-current={case_.cle === etat ? "true" : undefined}
          >
            {case_.label}
          </Link>
        ))}
      </nav>

      <section className="sheet bloc" aria-label="Avis consignés">
        <div className="section-head">
          <h2>
            {etat === ""
              ? "Tous les avis"
              : etat === "filees"
                ? "Dans la file"
                : etat === "envoyees"
                  ? "Remis aux parents"
                  : "Devenus inutiles"}
          </h2>
          <span className="section-head__aside">
            {liste.relances.length} ligne{liste.relances.length > 1 ? "s" : ""} ·{" "}
            {dues.length} en attente
          </span>
        </div>

        <div className="relances-liste">
          {liste.relances.length === 0 ? (
            <div className="empty">
              <h3>Aucun avis sous ce filtre.</h3>
              <p>
                Soit la caisse est propre, soit le calendrier n&apos;est pas
                encore posé pour cette année.
              </p>
              <Link href="/app/eleves?etat=retard" className="text-link">
                Voir les familles en retard
              </Link>
            </div>
          ) : null}
          {liste.relances.map((relance, index) => (
            <RelanceLigne key={relance.id} relance={relance} rang={index + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
