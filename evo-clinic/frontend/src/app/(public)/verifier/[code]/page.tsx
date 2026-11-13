import type { Metadata } from "next";
import Link from "next/link";

import { Bascules } from "@/components/bascules";
import { NomProduit } from "@/components/marque";
import { lirePublique } from "@/lib/api";
import { formats } from "@/lib/format";
import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { RecuPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Receipt" : "Reçu" };
}

export default async function PageRecu({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const f = formats(langue);
  const { code } = await params;

  const recu = await lirePublique<RecuPublic>(`/public/recu/${encodeURIComponent(code)}`, langue);

  return (
    <div className="cadc-app">
      <header className="cadc-bandeau">
        <div className="cadc-gabarit cadc-bandeau__rangee">
          <NomProduit href="/" />
          <Bascules langue={langue} />
        </div>
      </header>
      <main id="contenu" className="cadc-corps">
        <div className="cadc-gabarit clinique">
          <div className="clinique__tete">
            <span className="cadc-badge cadc-badge--acier">{t("verifier.titre")}</span>
            <h1>{code.toUpperCase()}</h1>
          </div>

          <section className="cadc-carte" aria-label={t("verifier.valide")}>
            {recu.valide ? (
              <div className="cadc-pile">
                <p className="cadc-note cadc-note--vert" role="status">
                  {t("verifier.valide")}
                </p>
                <dl className="cadc-liste cadc-pile cadc-pile--serree">
                  <div className="cadc-ligne">
                    <dt className="cadc-ligne__nom">{t("verifier.montant")}</dt>
                    <dd className="cadc-ligne__valeur"><strong>{f.fcfa(recu.montant ?? 0)}</strong></dd>
                  </div>
                  <div className="cadc-ligne">
                    <dt className="cadc-ligne__nom">{t("verifier.moyen")}</dt>
                    <dd className="cadc-ligne__valeur">{recu.moyen ? t(`moyen.${recu.moyen}`) : "—"}</dd>
                  </div>
                  <div className="cadc-ligne">
                    <dt className="cadc-ligne__nom">{t("verifier.patient")}</dt>
                    <dd className="cadc-ligne__valeur">{recu.patient}</dd>
                  </div>
                  {recu.acte ? (
                    <div className="cadc-ligne">
                      <dt className="cadc-ligne__nom">{t("verifier.acte")}</dt>
                      <dd className="cadc-ligne__valeur">{recu.acte}</dd>
                    </div>
                  ) : null}
                  <div className="cadc-ligne">
                    <dt className="cadc-ligne__nom">{t("verifier.date")}</dt>
                    <dd className="cadc-ligne__valeur">{recu.date ? f.date(recu.date) : "—"}</dd>
                  </div>
                  {recu.note ? (
                    <div className="cadc-ligne">
                      <dt className="cadc-ligne__nom">{t("verifier.note")}</dt>
                      <dd className="cadc-ligne__valeur">{recu.note}</dd>
                    </div>
                  ) : null}
                </dl>
                <p className="cadc-note">
                  {recu.clinique} · {recu.quartier || recu.ville}
                </p>
              </div>
            ) : (
              <div className="cadc-pile">
                <p className="cadc-note cadc-note--rouge" role="alert">
                  {t("verifier.invalide")}
                </p>
                <div className="cadc-acts">
                  <Link href="/verifier" className="cadc-bouton cadc-bouton--premier">
                    {t("verifier.chercher")}
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
