export function Icone({
  nom,
  taille = 18,
}: {
  nom: string;
  taille?: number;
}) {
  const traits = {
    width: taille,
    height: taille,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "square" as const,
    "aria-hidden": true,
  };

  switch (nom) {
    case "caisse":
      return (
        <svg {...traits}>
          <rect x="3" y="7" width="14" height="9" />
          <path d="M3 11h14" />
          <path d="M8 14h4" />
          <path d="M6 7V5h8v2" />
        </svg>
      );
    case "eleve":
      return (
        <svg {...traits}>
          <circle cx="10" cy="6.5" r="3" />
          <path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
        </svg>
      );
    case "classe":
      return (
        <svg {...traits}>
          <rect x="3" y="3" width="14" height="14" />
          <path d="M3 8h14" />
          <path d="M8 8v9" />
        </svg>
      );
    case "relance":
      return (
        <svg {...traits}>
          <path d="M4 16V7" />
          <path d="M8 16V4" />
          <path d="M12 16V9" />
          <path d="M16 16V5" />
        </svg>
      );
    case "recu":
      return (
        <svg {...traits}>
          <path d="M5 3h10v14l-2.5-1.5L10 17l-2.5-1.5L5 17z" />
          <path d="M8 7h4" />
          <path d="M8 10h4" />
        </svg>
      );
    case "journal":
      return (
        <svg {...traits}>
          <rect x="3" y="4" width="14" height="13" />
          <path d="M3 8h14" />
          <path d="M7 4V2" />
          <path d="M13 4V2" />
          <path d="M7 12h6" />
        </svg>
      );
    case "reglage":
      return (
        <svg {...traits}>
          <circle cx="10" cy="10" r="3" />
          <path d="M10 2v3" />
          <path d="M10 15v3" />
          <path d="M2 10h3" />
          <path d="M15 10h3" />
          <path d="M4.5 4.5 6.7 6.7" />
          <path d="M13.3 13.3l2.2 2.2" />
        </svg>
      );
    case "feuille":
      return (
        <svg {...traits}>
          <path d="M5 3h7l3 3v11H5z" />
          <path d="M12 3v3h3" />
          <path d="M8 10h4" />
          <path d="M8 13h4" />
        </svg>
      );
    case "check":
      return (
        <svg {...traits}>
          <path d="M4 10.5 8 14l8-9" />
        </svg>
      );
    case "fleche":
      return (
        <svg {...traits}>
          <path d="M3 10h13" />
          <path d="M12 6l4 4-4 4" />
        </svg>
      );
    case "alerte":
      return (
        <svg {...traits}>
          <path d="M10 3 2 17h16z" />
          <path d="M10 8v4" />
          <path d="M10 14h.01" />
        </svg>
      );
    case "croix":
      return (
        <svg {...traits}>
          <path d="M5 5l10 10" />
          <path d="M15 5 5 15" />
        </svg>
      );
    case "monnaie":
      return (
        <svg {...traits}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v8" />
          <path d="M7.5 8h5" />
        </svg>
      );
    default:
      return null;
  }
}
