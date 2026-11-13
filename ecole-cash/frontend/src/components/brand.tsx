import Link from "next/link";

type MarqueProps = {
  title?: string;
  className?: string;
};

// Caisse de l'école : le tiroir, la fente, le reçu qui dépasse.
export function EcoleCashMark({ title, className }: MarqueProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="5" y="18" width="34" height="20" />
      <path d="M11 18V9h14v9" />
      <path d="M11 13h14" />
      <path d="M5 25h34" />
      <path d="M19 32h6" />
      <path d="M31 22h4" />
    </svg>
  );
}

type WordmarkProps = {
  href?: string;
  sous?: string;
};

export function Wordmark({ href = "/", sous }: WordmarkProps) {
  const contenu = (
    <>
      <EcoleCashMark title="ÉCOLE CASH" className="brand__mark" />
      <span className="brand__text">
        <span className="brand__name">ÉCOLE CASH</span>
        <span className="brand__sub">{sous ?? "la caisse de l'école"}</span>
      </span>
    </>
  );

  if (!href) {
    return <span className="brand">{contenu}</span>;
  }

  return (
    <Link href={href} className="brand">
      {contenu}
    </Link>
  );
}
