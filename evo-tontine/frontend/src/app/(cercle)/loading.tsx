import { langueCourante } from "@/lib/session";
import { traduire } from "@/lib/langue";

export default async function Chargement() {
  const langue = await langueCourante();
  const t = traduire(langue).t;

  return (
    <div className="cadc-gabarit cadc-pile" aria-busy="true">
      <p className="cadc-badge cadc-badge--acier">{t("commun.chargement")}</p>
      <div className="attente" aria-hidden>
        <span style={{ width: "62%" }} />
        <span style={{ width: "88%" }} />
        <span style={{ width: "44%" }} />
        <span style={{ width: "76%" }} />
        <span style={{ width: "52%" }} />
      </div>
    </div>
  );
}
