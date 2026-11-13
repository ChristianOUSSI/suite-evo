const montant = new Intl.NumberFormat("fr-FR", {
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

const MOIS_COURT = [
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

export function fcfa(value: number): string {
  return `${montant.format(value)} FCFA`;
}

export function fcfaCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions.toLocaleString("fr-FR", {
      maximumFractionDigits: millions < 10 ? 2 : 1,
    })} M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} k`;
  }
  return montant.format(value);
}

function jourSeul(value: string): Date {
  const [annee, mois, jour] = value.slice(0, 10).split("-").map(Number);
  return new Date(annee, mois - 1, jour);
}

export function longDate(value: string): string {
  const date = jourSeul(value);
  return `${date.getDate()} ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

export function shortDate(value: string): string {
  const date = jourSeul(value);
  return `${String(date.getDate()).padStart(2, "0")} ${MOIS_COURT[date.getMonth()]} ${date.getFullYear()}`;
}

export function weekday(value: string): string {
  return JOURS[jourSeul(value).getDay()];
}

export function weekdayAndDate(value: string): string {
  return `${weekday(value)} ${longDate(value)}`;
}

export function isoToday(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export function heureDouala(value: string): string {
  const normalise = /Z$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalise);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Douala",
  }).format(date);
}

export function pourcentage(value: number): string {
  return `${Math.round(value)} %`;
}

export function initiales(value: string): string {
  const parts = value
    .replace(/\b(mme|mr|soeur|sister|abbé|frère)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// Le backend ne rend que la forme +237XXXXXXXXX ; on la découpe au rythme
// parlé de Douala, 6 99 30 77 24, pour que l'œil vérifie sans recompter.
export function telephoneLocal(value: string): string {
  const chiffres = value.replace(/\D/g, "");
  const local = chiffres.startsWith("237")
    ? chiffres.slice(3)
    : chiffres.startsWith("00")
      ? chiffres.slice(2)
      : chiffres;
  if (local.length !== 9) {
    return value;
  }
  return local
    .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{1})/, "$1 $2 $3 $4 $5");
}

// Avant envoi à l'API : on accepte ce que la caissière tape vraiment,
// « 699307724 », « 0699307724 », « 237699307724 », « +237 6 99 30 77 24 ».
export function canoniseTelephone(value: string): string | null {
  const chiffres = value.replace(/\D/g, "");
  let no = chiffres;
  if (no.startsWith("00")) {
    no = no.slice(2);
  } else if (no.startsWith("237") && no.length > 9) {
    no = no.slice(3);
  } else if (no.startsWith("0") && no.length === 10) {
    no = no.slice(1);
  }
  if (no.length !== 9) {
    return null;
  }
  if (!/^[267]/.test(no)) {
    return null;
  }
  return `+237${no}`;
}
