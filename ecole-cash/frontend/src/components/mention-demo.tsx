import { Icone } from "./icone";

// La mention démo se pose au plus près du geste qui serait une vraie
// transaction, jamais seulement en pied de page.
export function MentionDemo({ texte }: { texte?: string }) {
  return (
    <p className="mention-demo">
      <Icone nom="alerte" taille={14} />
      {texte ??
        "Démo : aucun envoi WhatsApp, aucun débit MoMo. Le reçu reste dans cette machine."}
    </p>
  );
}
