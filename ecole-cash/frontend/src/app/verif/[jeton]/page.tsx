import type { Metadata } from "next";
import Link from "next/link";

import { EcoleCashMark } from "@/components/brand";
import { Icone } from "@/components/icone";
import { lireOuRien } from "@/lib/api";
import { heureDouala } from "@/lib/format";
import type { RecuPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vérification d'un reçu",
  description:
    "Contrôler qu'un reçu de scolarité a bien été consigné à la caisse de l'école.",
  // La page nomme un élève et donne un montant : elle ne doit jamais se
  // retrouver dans un annuaire public, même si le jeton est difficile à deviner.
  robots: { index: false, follow: false, noarchive: true },
};

export default async function Verification({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const { jeton } = await params;
  const recu = await lireOuRien<RecuPublic>(
    `/public/recus/${encodeURIComponent(jeton)}`,
  );

  return (
    <main id="contenu" className="shell recu-public">
      <span className="kicker">
        <Icone nom="recu" taille={14} /> Vérification de reçu
      </span>

      {!recu ? (
        <div className="sheet sheet--offset recu-public__carte">
          <span className="stamp">Introuvable</span>
          <h1>Ce numéro n'est dans aucune école.</h1>
          <p>
            Le code se trouve en bas du reçu, dix caractères sans espaces.
            Vérifiez la casse et les chiffres : le <span className="mono">O</span>{" "}
            et le{" "}
            <span className="mono">0</span> ne se ressemblent pas à l&apos;écrit.
          </p>
          <div className="form-actions">
            <Link href="/" className="btn btn--ink">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      ) : (
        <div className="sheet sheet--offset recu-public__carte">
          <div className="page-head__aside" style={{ justifyContent: "flex-start" }}>
            <span className={`stamp ${recu.valide ? "stamp--moss" : ""}`}>
              {recu.valide ? "Reçu valable" : "Reçu annulé"}
            </span>
            <span className="tag tag--quiet">{recu.statut_label}</span>
          </div>

          <EcoleCashMark className="brand__mark" title="ÉCOLE CASH" />
          <p className="eyebrow" style={{ marginTop: "0.6rem" }}>
            {recu.ecole}
          </p>

          <p className="recu-public__montant money">{recu.montant_label}</p>
          <p className="prix__suite">
            {recu.numero} · réglé par {recu.mode} · {recu.jour} à{" "}
            {heureDouala(recu.emission)}
          </p>

          <dl className="recu-public__grille">
            <div>
              <dt>Élève</dt>
              <dd>{recu.eleve}</dd>
            </div>
            <div>
              <dt>Classe</dt>
              <dd>{recu.classe}</dd>
            </div>
            <div>
              <dt>Numéro de reçu</dt>
              <dd className="mono">{recu.numero}</dd>
            </div>
            <div>
              <dt>Code de contrôle</dt>
              <dd className="mono">{jeton.toUpperCase()}</dd>
            </div>
          </dl>

          <p className="mention-demo">
            <Icone nom="alerte" taille={14} />
            Démo : cette page lit la caisse d&apos;une école fictive. Aucun
            encaissement réel n&apos;est associé.
          </p>
        </div>
      )}
    </main>
  );
}
