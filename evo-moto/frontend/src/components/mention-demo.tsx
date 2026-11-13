/**
 * La mention démo se pose sur le geste qui serait une vraie transaction,
 * jamais seulement en pied de page.
 */
export function MentionDemo({
  langue,
  texte,
}: {
  langue: string;
  texte?: string;
}) {
  return (
    <p className="cadc-demo">
      <svg
        width={16}
        height={16}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="square"
        aria-hidden
      >
        <path d="M10 3 2 17h16L10 3Z" />
        <path d="M10 8v4" />
        <path d="M10 14.5v.5" />
      </svg>
      {texte ??
        (langue === "en"
          ? "Demo: no SMS sent, no MoMo debit, no money leaves this machine."
          : "Démo : aucun SMS envoyé, aucun débit MoMo, aucun argent ne quitte cette machine.")}
    </p>
  );
}
