import { Icone } from "./icone";
import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";

// La mention démo se pose au plus près du geste qui serait une vraie
// transaction, jamais seulement en pied de page.
export function MentionDemo({
  texte,
  langue = LANGUE_DEFAUT,
}: {
  texte?: string;
  langue?: Langue;
}) {
  return (
    <p className="mention-demo">
      <Icone nom="alerte" taille={14} />
      {texte ?? t("demo.mention", langue)}
    </p>
  );
}
