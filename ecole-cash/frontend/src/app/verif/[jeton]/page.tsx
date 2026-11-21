import type { Metadata } from "next";
import Link from "next/link";

import { EcoleCashMark } from "@/components/brand";
import { Icone } from "@/components/icone";
import { lireOuRien } from "@/lib/api";
import { heureDouala } from "@/lib/format";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import type { RecuPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return {
    title: t("verif.meta.titre", langue),
    description: t("verif.meta.desc", langue),
    // La page nomme un élève et donne un montant : elle ne doit jamais se
    // retrouver dans un annuaire public, même si le jeton est difficile à deviner.
    robots: { index: false, follow: false, noarchive: true },
  };
}

export default async function Verification({
  params,
}: {
  params: Promise<{ jeton: string }>;
}) {
  const langue = await langueServeur();
  const { jeton } = await params;
  const recu = await lireOuRien<RecuPublic>(
    `/public/recus/${encodeURIComponent(jeton)}`,
  );

  return (
    <main id="contenu" className="shell recu-public">
      <span className="kicker">
        <Icone nom="recu" taille={14} /> {t("verif.kicker", langue)}
      </span>

      {!recu ? (
        <div className="sheet sheet--offset recu-public__carte">
          <span className="stamp">{t("verif.introuvable", langue)}</span>
          <h1>{t("verif.titre_absent", langue)}</h1>
          <p>{t("verif.message_absent", langue)}</p>
          <div className="form-actions">
            <Link href="/" className="btn btn--ink">
              {t("verif.retour", langue)}
            </Link>
          </div>
        </div>
      ) : (
        <div className="sheet sheet--offset recu-public__carte">
          <div className="page-head__aside" style={{ justifyContent: "flex-start" }}>
            <span className={`stamp ${recu.valide ? "stamp--moss" : ""}`}>
              {recu.valide ? t("verif.valable", langue) : t("verif.annule", langue)}
            </span>
            <span className="tag tag--quiet">{recu.statut_label}</span>
          </div>

          <EcoleCashMark className="brand__mark" title="ÉCOLE CASH" />
          <p className="eyebrow" style={{ marginTop: "0.6rem" }}>
            {recu.ecole}
          </p>

          <p className="recu-public__montant money">{recu.montant_label}</p>
          <p className="prix__suite">
            {recu.numero} · {t("verif.regle_par", langue)} {recu.mode} · {recu.jour} {t("verif.jour_a", langue)}{" "}
            {heureDouala(recu.emission)}
          </p>

          <dl className="recu-public__grille">
            <div>
              <dt>{t("verif.eleve", langue)}</dt>
              <dd>{recu.eleve}</dd>
            </div>
            <div>
              <dt>{t("verif.classe", langue)}</dt>
              <dd>{recu.classe}</dd>
            </div>
            <div>
              <dt>{t("verif.numero", langue)}</dt>
              <dd className="mono">{recu.numero}</dd>
            </div>
            <div>
              <dt>{t("verif.code", langue)}</dt>
              <dd className="mono">{jeton.toUpperCase()}</dd>
            </div>
          </dl>

          <p className="mention-demo">
            <Icone nom="alerte" taille={14} />
            {t("verif.demo", langue)}
          </p>
        </div>
      )}
    </main>
  );
}
