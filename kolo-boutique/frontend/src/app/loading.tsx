import { Icone } from "@/components/icone";
import { t } from "@/lib/langue";
import { langueServeur } from "@/lib/langue-serveur";

export default async function Chargement() {
  const langue = await langueServeur();
  return (
    <div className="chargement">
      <Icone nom="comptoir" taille={26} />
      <p className="chargement__note">{t("chargement.note", langue)}</p>
    </div>
  );
}
