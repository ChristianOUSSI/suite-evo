const amountFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

const MONTHS = [
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

const MONTHS_SHORT = [
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

const WEEKDAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export function fcfa(amount: number): string {
  return `${amountFormatter.format(amount)} FCFA`;
}

export function fcfaCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions.toLocaleString("fr-FR", {
      maximumFractionDigits: millions < 10 ? 2 : 1,
    })} M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${Math.round(amount / 1_000)} k`;
  }
  return amountFormatter.format(amount);
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function longDate(value: string): string {
  const date = parseDateOnly(value);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function shortDate(value: string): string {
  const date = parseDateOnly(value);
  return `${String(date.getDate()).padStart(2, "0")} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function monthAndYear(value: string): string {
  const date = parseDateOnly(value);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function weekday(value: string): string {
  const date = parseDateOnly(value);
  return WEEKDAYS[date.getDay()];
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

export function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function dateTime(value: string): string {
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(value)
    ? value
    : `${value}Z`;
  const date = new Date(normalized);
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

export function daysWord(days: number): string {
  if (days <= 0) {
    return "aujourd'hui";
  }
  if (days === 1) {
    return "1 jour";
  }
  return `${days} jours`;
}

export function lateStamp(days: number): string {
  if (days <= 0) {
    return "à échoir";
  }
  return `${days} j de retard`;
}

export function initials(name: string): string {
  const parts = name
    .replace(/\b(ets|mme|mr|m|sarl|sa|hôtel|ecole|école)\b/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function percent(value: number): string {
  return `${Math.round(value)} %`;
}

export function spokenAmount(amount: number): string {
  return `${amountFormatter.format(amount).replace(/\u202f|\u00a0/g, " ")} francs CFA`;
}
