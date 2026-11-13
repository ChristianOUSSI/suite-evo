export type Langue = "fr" | "en";

export interface EntreeTextuelle {
  fr: string;
  en: string;
}

export type Dictionnaire = Record<string, string | EntreeTextuelle>;

export interface Traducteur {
  langue: Langue;
  t(cle: string, variables?: Record<string, string | number>): string;
}

export const LANGUES: Langue[];
export const LANGUE_DEFAUT: Langue;
export const NOM_COOKIE: string;
export const ETIQUETTES_LANGUE: Record<Langue, { court: string; long: string }>;

export function cleManquante(cle: string): string;
export function normaliserLangue(valeur: unknown): Langue;
export function creerTraducteur(dictionnaire: Dictionnaire, langue?: string): Traducteur;
export function traduire(langue: string, dictionnaire: Dictionnaire): Traducteur;
