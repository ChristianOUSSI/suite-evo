import type { Metadata } from "next";

import { Guichet } from "@/components/guichet";
import { lire } from "@/lib/api";
import { seanceObligatoire } from "@/lib/session";
import type { Eleve, Tableau } from "@/lib/types";

import "../../../../styles/guichet.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guichet",
};

export default async function GuichetPage() {
  const [ardoises, journee, session] = await Promise.all([
    lire<{ eleves: Eleve[] }>("/engagements"),
    lire<Tableau>("/dashboard"),
    seanceObligatoire(),
  ]);

  return (
    <div className="shell">
      <div className="page-head">
        <div className="page-head__main">
          <span className="kicker">Encaissement · {journee.day}</span>
          <h1 className="display">Le guichet</h1>
          <p className="page-head__lede">
            On cherche la famille, on pose le montant, le reçu s&apos;écrit seul.
            {session.ecole.whatsapp_actif
              ? " Le message du parent est préparé ici, il ne part pas."
              : " WhatsApp est coupé dans les réglages : le texte reste au carnet."}
          </p>
        </div>
      </div>

      <Guichet
        eleves={ardoises.eleves}
        classes={journee.classes}
        ecole={session.ecole}
      />
    </div>
  );
}
