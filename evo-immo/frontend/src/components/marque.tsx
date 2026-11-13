import Link from "next/link";

type MarqueProps = {
  titre?: string;
  className?: string;
};

/**
 * Le signe CADC repris des logos livrés : le disque, la flèche qui entre à
 * gauche, celle qui sort en haut. Tracé à la main, pas de photo dans le rail :
 * sur une réception sans réseau, un SVG pèse quelques centaines d'octets.
 */
export function MarqueCadc({ titre, className }: MarqueProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="square"
      className={className}
      role={titre ? "img" : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      <circle cx="24" cy="21" r="13" />
      <path d="M15 15 8 21l7 6" />
      <path d="M31 30V14h-6" />
      <path d="M31 14l5-5" />
      <path d="M20 19h8" />
      <path d="M20 23h8" />
    </svg>
  );
}

type NomProps = {
  href?: string;
  sous?: string;
};

export function NomProduit({ href = "/", sous }: NomProps) {
  const contenu = (
    <>
      <MarqueCadc titre="evo-immo" className="cadc-marque__signe" />
      <span className="cadc-marque__texte">
        <span className="cadc-marque__nom">evo-immo</span>
        <span className="cadc-marque__sous">{sous ?? "CODE AXIS DIGITAL CAMEROON"}</span>
      </span>
    </>
  );

  if (!href) {
    return <span className="cadc-marque">{contenu}</span>;
  }

  return (
    <Link href={href} className="cadc-marque">
      {contenu}
    </Link>
  );
}
