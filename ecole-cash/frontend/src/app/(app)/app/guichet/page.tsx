import type { Metadata } from "next";

import { Guichet } from "@/components/guichet";
import { lire } from "@/lib/api";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";
import { seanceObligatoire } from "@/lib/session";
import type { Eleve, Tableau } from "@/lib/types";

import "../../../../styles/guichet.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueServeur();
  return { title: t("guichet.meta", langue) };
}

export default async function GuichetPage() {
  const langue = await langueServeur();
  const [ardoises, journee, session] = await Promise.all([
    lire<{ eleves: Eleve[] }>("/engagements"),
    lire<Tableau>("/dashboard"),
    seanceObligatoire(),
  ]);

  return (
    <div className="shell">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">{t("guichet.kicker", langue, { jour: journee.day })}</span>
          <h1 className="display">{t("guichet.titre", langue)}</h1>
          <p className="page-head__lede">
            {t("guichet.lede", langue)}
            {session.ecole.whatsapp_actif
              ? t("guichet.lede_whatsapp", langue)
              : t("guichet.lede_coupe", langue)}
          </p>
        </div>
      </div>

      <Guichet
        eleves={ardoises.eleves}
        classes={journee.classes}
        ecole={session.ecole}
        langue={langue}
      />
    </div>
  );
}
