type Prop = {
  nom: string;
  taille?: number;
};

const traits = (taille: number) => ({
  width: taille,
  height: taille,
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "square" as const,
  "aria-hidden": true,
});

export function Icone({ nom, taille = 18 }: Prop) {
  const t = traits(taille);

  switch (nom) {
    case "comptoir":
      return (
        <svg {...t}>
          <path d="M2 8h16l-2 9H4L2 8Z" />
          <path d="M5 8V5h10v3" />
          <path d="M8 12h4" />
        </svg>
      );
    case "voix":
      return (
        <svg {...t}>
          <path d="M4 9v2" />
          <path d="M7 6v8" />
          <path d="M10 3v14" />
          <path d="M13 7v6" />
          <path d="M16 9v2" />
        </svg>
      );
    case "rayon":
      return (
        <svg {...t}>
          <path d="M3 4h14" />
          <path d="M3 10h14" />
          <path d="M3 16h14" />
          <path d="M6 4v6" />
          <path d="M13 10v6" />
        </svg>
      );
    case "vente":
      return (
        <svg {...t}>
          <path d="M3 5h3l2 9h7" />
          <path d="M8 16h6" />
          <circle cx="14.5" cy="8.5" r="1.6" />
        </svg>
      );
    case "tiroir":
      return (
        <svg {...t}>
          <rect x="3" y="5" width="14" height="10" />
          <path d="M3 10h14" />
          <path d="M8 7.5h4" />
        </svg>
      );
    case "reglage":
      return (
        <svg {...t}>
          <path d="M3 6h9" />
          <path d="M15 6h2" />
          <path d="M3 14h3" />
          <path d="M9 14h8" />
          <circle cx="13" cy="6" r="1.8" />
          <circle cx="7" cy="14" r="1.8" />
        </svg>
      );
    case "feuille":
      return (
        <svg {...t}>
          <path d="M5 3h7l3 3v11H5V3Z" />
          <path d="M12 3v3h3" />
          <path d="M8 10h5" />
          <path d="M8 13h4" />
        </svg>
      );
    case "check":
      return (
        <svg {...t}>
          <path d="M4 10.5 8 14l8-9" />
        </svg>
      );
    case "alerte":
      return (
        <svg {...t}>
          <path d="M10 3 2 17h16L10 3Z" />
          <path d="M10 8v4" />
          <path d="M10 14.5v.5" />
        </svg>
      );
    case "croix":
      return (
        <svg {...t}>
          <path d="M5 5l10 10" />
          <path d="M15 5 5 15" />
        </svg>
      );
    case "fleche":
      return (
        <svg {...t}>
          <path d="M3 10h13" />
          <path d="M12 6l4 4-4 4" />
        </svg>
      );
    case "rond":
      return (
        <svg {...t}>
          <circle cx="10" cy="10" r="6.5" />
        </svg>
      );
    default:
      return (
        <svg {...t}>
          <path d="M3 10h14" />
        </svg>
      );
  }
}
