import { t, LANGUE_DEFAUT, type Langue } from "@/lib/langue";

import { Icone } from "./icone";

// La mention démo se pose sur le geste qui serait une vraie transaction,
// jamais seulement en pied de page.
export function MentionDemo({
  texte,
  langue = LANGUE_DEFAUT,
}: {
  texte?: string;
  langue?: Langue;
}) {
  return (
    <p className="mention-demo">
      <Icone nom="alerte" taille={13} />
      {texte ?? t("mention.demo", langue)}
    </p>
  );
}
