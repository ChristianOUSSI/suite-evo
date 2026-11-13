// Le trait de flèche des boutons. Un glyphe Unicode rendrait différemment selon
// la police installée sur le téléphone ; le tracé, lui, est le même partout.
export function Fleche({ taille = 15 }: { taille?: number }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      aria-hidden="true"
    >
      <path d="M3 10h13" />
      <path d="M12 6l4 4-4 4" />
    </svg>
  );
}
