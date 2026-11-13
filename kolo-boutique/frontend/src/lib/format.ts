const ESPECE = "\u202f";

const formatMontant = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const MOIS_COURTS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

const JOURS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export function fcfa(montant: number): string {
  return `${formatMontant.format(montant)}${ESPECE}FCFA`;
}

export function fcfaCourt(montant: number): string {
  if (Math.abs(montant) >= 1_000_000) {
    const millions = montant / 1_000_000;
    return `${millions.toLocaleString("fr-FR", {
      maximumFractionDigits: millions < 10 ? 2 : 1,
    })}${ESPECE}M`;
  }
  if (Math.abs(montant) >= 1_000) {
    return `${Math.round(montant / 1_000)}${ESPECE}k`;
  }
  return formatMontant.format(montant);
}

function parseJour(value: string): Date {
  const [annee, mois, jour] = value.slice(0, 10).split("-").map(Number);
  return new Date(annee, mois - 1, jour);
}

export function jourLong(value: string): string {
  const date = parseJour(value);
  return `${JOURS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

export function jourCourt(value: string): string {
  const date = parseJour(value);
  return `${String(date.getDate()).padStart(2, "0")} ${MOIS_COURTS[date.getMonth()]}`;
}

export function lettreJour(value: string): string {
  return JOURS[parseJour(value).getDay()].slice(0, 1).toUpperCase();
}

export function aujourdhui(): string {
  const maintenant = new Date();
  return [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dansJours(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() + n);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function heure(instant: string): string {
  const normalise = /Z$|[+-]\d{2}:?\d{2}$/.test(instant)
    ? instant
    : `${instant}Z`;
  const date = new Date(normalise);
  if (Number.isNaN(date.getTime())) {
    return instant;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  }).format(date);
}

export function pourcentage(valeur: number): string {
  return `${Math.round(valeur)}${ESPECE}%`;
}

export function initiales(nom: string): string {
  const morceaux = nom
    .replace(/\b(madame|monsieur|mr|mme|fille|boutique|aliment)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return morceaux
    .slice(0, 2)
    .map((morceau) => morceau[0]?.toUpperCase() ?? "")
    .join("");
}

export function telephoneLocal(valeur: string): string {
  const chiffres = (valeur || "").replace(/\D/g, "");
  let numero = chiffres;
  if (numero.startsWith("237") && numero.length > 9) {
    numero = numero.slice(3);
  }
  if (numero.length !== 9) {
    return valeur;
  }
  return [
    numero[0],
    numero.slice(1, 3),
    numero.slice(3, 5),
    numero.slice(5, 7),
    numero.slice(7, 9),
  ].join(" ");
}

export function canoniseTelephone(valeur: string): string | null {
  const chiffres = (valeur || "").replace(/\D/g, "");
  let numero = chiffres;
  if (numero.startsWith("00")) {
    numero = numero.slice(2);
  } else if (numero.startsWith("237") && numero.length > 9) {
    numero = numero.slice(3);
  } else if (numero.startsWith("0") && numero.length === 10) {
    numero = numero.slice(1);
  }
  if (numero.length !== 9) {
    return null;
  }
  if (!/^[267]/.test(numero)) {
    return null;
  }
  return `+237${numero}`;
}
