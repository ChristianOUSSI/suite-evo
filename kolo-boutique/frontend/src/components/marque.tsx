import Link from "next/link";

type MarqueProp = {
  titre?: string;
  className?: string;
};

// Le comptoir : l'auvent à rayures, les montants, le plateau de la balance.
export function KoloMark({ titre, className }: MarqueProp) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      className={className}
      role={titre ? "img" : undefined}
      aria-label={titre}
      aria-hidden={titre ? undefined : true}
    >
      <path d="M6 14h32" />
      <path d="M6 14 10 7h24l4 7" />
      <path d="M13 14v23" />
      <path d="M31 14v23" />
      <path d="M9 37h26" />
      <path d="M18 20h8" />
      <path d="M22 20v7" />
      <path d="M18 30h8" />
    </svg>
  );
}

type NomProp = {
  href?: string;
  sous?: string;
};

export function NomComptoir({ href = "/", sous }: NomProp) {
  const contenu = (
    <>
      <KoloMark titre="KOLO BOUTIQUE" className="marque__signe" />
      <span className="marque__texte">
        <span className="marque__nom">KOLO BOUTIQUE</span>
        <span className="marque__sous">{sous ?? "le cahier du comptoir"}</span>
      </span>
    </>
  );

  if (!href) {
    return <span className="marque">{contenu}</span>;
  }

  return (
    <Link href={href} className="marque">
      {contenu}
    </Link>
  );
}
