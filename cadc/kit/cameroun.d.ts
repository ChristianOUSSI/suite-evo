import type { Langue } from "./i18n";

export interface Ville {
  nom: string;
  region: string;
  quartiers: string[];
}

export interface Rail {
  cle: string;
  label: Record<Langue, string>;
  aide: Record<Langue, string>;
}

export const VILLES: Ville[];
export const RAILS: Rail[];
export const DEVISES: string[];

export function canoniseTelephone(brut: string | null | undefined): string | null;
export function afficheTelephone(brut: string | null | undefined): string;
export function operateur(brut: string | null | undefined): string;
export function fcfa(montant: number | string, langue?: Langue | string): string;
export function fcfaCourt(montant: number | string, langue?: Langue | string): string;
export function dateLongue(valeur: string | Date, langue?: Langue | string): string;
export function jourEtDate(valeur: string | Date, langue?: Langue | string): string;
export function heureLocal(valeur: string | Date, langue?: Langue | string): string;
export function aujourdhui(): string;
export function dansJours(n: number): string;
export function joursEntre(debut: string, fin: string): number;
export function pourcentage(valeur: number, langue?: Langue | string): string;
export function salutation(langue?: Langue | string): string;
export function initiales(nom: string): string;
