import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export default async function Chargement() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-gabarit cadc-pile" aria-busy="true">
      <p className="cadc-badge cadc-badge--acier">{t("commun.chargement")}</p>
      <div className="attente" aria-hidden>
        <span style={{ width: "48%" }} />
        <span style={{ width: "92%" }} />
        <span style={{ width: "37%" }} />
        <span style={{ width: "71%" }} />
        <span style={{ width: "58%" }} />
        <span style={{ width: "83%" }} />
      </div>
    </div>
  );
}
