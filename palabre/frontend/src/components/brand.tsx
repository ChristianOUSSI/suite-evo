import Link from "next/link";

type MarkProps = {
  className?: string;
  title?: string;
};

export function PalabreMark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 44 44"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
    >
      <path
        d="M8 5.5h23l6 6v21H20.5L13 39v-6.5H8V5.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
      <path d="M31 5.5v6h6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M14 15.5h16M14 21.5h17M14 27.5h9"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="31.5" cy="28.5" r="2.7" fill="#a63a34" />
    </svg>
  );
}

export function Wordmark({
  href = "/",
  light = false,
  compact = false,
}: {
  href?: string;
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`brand${light ? " brand--light" : ""}`}
      aria-label="PALABRE, accueil"
    >
      <PalabreMark className="brand__mark" />
      <span className="brand__copy">
        <span className="brand__name">PALABRE</span>
        {!compact && (
          <span className="brand__sub">Carnet de comptes · Douala</span>
        )}
      </span>
    </Link>
  );
}
