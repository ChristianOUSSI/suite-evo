import { Icone } from "./icone";

// La mention démo se pose sur le geste qui serait une vraie transaction,
// jamais seulement en pied de page.
export function MentionDemo({ texte }: { texte?: string }) {
  return (
    <p className="mention-demo">
      <Icone nom="alerte" taille={13} />
      {texte ??
        "Démo : aucun vocal WhatsApp reçu, aucun débit MoMo. L’écriture reste dans cette machine."}
    </p>
  );
}
