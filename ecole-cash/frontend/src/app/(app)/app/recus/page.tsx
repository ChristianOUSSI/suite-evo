import type { Metadata } from "next";
import Link from "next/link";

import { EtiquetteRecu } from "@/components/etiquettes";
import { Icone } from "@/components/icone";
import { BoutonRenvoi } from "@/components/relances-outils";
import { lire } from "@/lib/api";
import { parametres } from "@/lib/client-api";
import { heureDouala, pourcentage } from "@/lib/format";
import type { ListeRecus } from "@/lib/types";

import "../../../../styles/classes.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reçus",
};

const JOURS = [1, 7, 30, 90];

export default async function Recus({
  searchParams,
}: {
  searchParams: Promise<{ jours?: string; statut?: string }>;
}) {
  const filtre = await searchParams;
  const jours = JOURS.includes(Number(filtre.jours)) ? Number(filtre.jours) : 30;
  const statut = filtre.statut ?? "";

  const rendu = await lire<ListeRecus>(
    `/recus${parametres({ jours, statut })}`,
  );

  const remis = rendu.recus.filter((recu) => recu.statut === "envoye").length;

  return (
    <div className="shell vitre">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">
            <Icone nom="recu" taille={14} /> {rendu.jours} derniers jours
          </span>
          <h1 className="display">Les reçus</h1>
          <p className="page-head__lede">
            {rendu.total} reçu{rendu.total > 1 ? "s" : ""} consigné
            {rendu.total > 1 ? "s" : ""}, {remis} marqué
            {remis > 1 ? "s" : ""} remis au parent ({pourcentage(
              rendu.total > 0 ? (remis / rendu.total) * 100 : 0,
            )}). Chacun porte un code de dix caractères que le parent fait
            vérifier sans ouvrir l&apos;application de l&apos;école.
          </p>
        </div>
        <div className="page-head__aside">
          <a href={`/api/exports/recus.csv?jours=${jours}`} className="btn" download>
            Feuille des reçus
          </a>
        </div>
      </div>

      <nav className="bande-filtre" aria-label="Période et état">
        {JOURS.map((un) => (
          <Link
            key={un}
            href={`/app/recus${parametres({ jours: un, statut })}`}
            className={un === jours ? "is-active" : undefined}
          >
            {un} j
          </Link>
        ))}
        {[
          { cle: "", label: "Tous les états" },
          { cle: "envoye", label: "Remis" },
          { cle: "file", label: "En file" },
          { cle: "coupé", label: "Canal coupé" },
          { cle: "annule", label: "Annulés" },
        ].map((un) => (
          <Link
            key={un.cle || "tous"}
            href={`/app/recus${parametres({ jours, statut: un.cle })}`}
            className={un.cle === statut ? "is-active" : undefined}
          >
            {un.label}
          </Link>
        ))}
      </nav>

      <section className="sheet bloc" aria-label="Reçus">
        <div className="section-head">
          <h2>
            {statut === ""
              ? "Tous les reçus"
              : statut === "envoye"
                ? "Marqués remis"
                : statut === "file"
                  ? "En file d'attente"
                  : statut === "annule"
                    ? "Reçus annulés"
                    : "Canal coupé"}
          </h2>
          <span className="section-head__aside">du plus récent</span>
        </div>

        <div className="reçu-grille">
          {rendu.recus.length === 0 ? (
            <div className="empty">
              <h3>Aucun reçu sur cette période.</h3>
              <p>
                Un reçu naît d&apos;un encaissement. Le guichet est le seul
                chemin.
              </p>
              <Link href="/app/guichet" className="text-link">
                Ouvrir le guichet
              </Link>
            </div>
          ) : null}
          {rendu.recus.map((recu) => (
            <div
              className={`reçu-carte${recu.statut === "annule" ? " reçu-carte--annule" : ""}`}
              key={recu.id}
            >
              <span className="reçu-carte__numero">
                {recu.numero}
                <small>{recu.reference || "sans référence"}</small>
              </span>
              <span className="reçu-carte__qui">
                <Link href={`/app/eleves/${recu.eleve_id}`} className="text-link" style={{ color: "inherit" }}>
                  {recu.eleve}
                </Link>
                <small>
                  {recu.classe} · {recu.destinataire_display || "numéro non noté"}
                </small>
              </span>
              <span className="reçu-carte__corps-court mono">
                {recu.mode_label}
                <br />
                <small>{recu.day} · {heureDouala(recu.emission)}</small>
              </span>
              <span className="reçu-carte__montant money">{recu.montant_label}</span>
              <EtiquetteRecu statut={recu.statut} />
              <span className="reçu-carte__outils">
                <Link href={recu.verif_url} className="btn btn--small btn--quiet">
                  Vérif
                </Link>
                {recu.statut !== "annule" ? <BoutonRenvoi recu={recu} /> : null}
              </span>
              <details className="reçu-carte__corps-détail">
                <summary>Texte remis au parent</summary>
                <p className="reçu-carte__corps">{recu.corps}</p>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
