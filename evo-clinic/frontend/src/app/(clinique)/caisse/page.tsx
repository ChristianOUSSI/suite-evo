import type { Metadata } from "next";

import { EncaisserGerant } from "@/components/encaisser-gerant";
import { MentionDemo } from "@/components/mention-demo";
import { lire } from "@/lib/api";
import { langueCourante, seanceObligatoire } from "@/lib/session";
import { traduire } from "@/lib/langue";
import type { ListePaiements, ListePatients } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const langue = await langueCourante();
  return { title: langue === "en" ? "Payments" : "Les paiements" };
}

export default async function PageCaisse() {
  const session = await seanceObligatoire();
  const langue = await langueCourante();
  const t = traduire(langue).t;
  const responsable = session.user.role === "responsable";

  const [paiements, patients] = await Promise.all([
    lire<ListePaiements>("/paiements", langue),
    lire<ListePatients>("/patients", langue),
  ]);

  return (
    <div className="cadc-gabarit clinique">
      <div className="clinique__tete">
        <span className="cadc-badge cadc-badge--acier">
          {paiements.paiements.length} {t("nav.caisse")}
        </span>
        <h1>{t("caisse.titre")}</h1>
        <p>{t("caisse.chapo")}</p>
      </div>

      <section className="cadc-carte" aria-label={t("caisse.titre")}>
        <EncaisserGerant
          paiements={paiements.paiements}
          patients={patients.patients}
          langue={langue}
          responsable={responsable}
        />
      </section>

      <MentionDemo langue={langue} />
    </div>
  );
}
