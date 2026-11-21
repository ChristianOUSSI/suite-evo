/**
 * Bilinguisme français / anglais pour le comptoir.
 * Le français reste la langue du comptoir ; l'anglais sert le personnel
 * des régions anglophones. Choix gardé dans un cookie, lu côté serveur
 * pour que la première page soit déjà dans la bonne langue.
 */

export const LANGUES = ["fr", "en"] as const;
export type Langue = (typeof LANGUES)[number];
export const LANGUE_DEFAUT: Langue = "fr";
export const NOM_COOKIE = "kolo_langue";

export function normaliserLangue(valeur: string | null | undefined): Langue {
  return valeur === "en" ? "en" : LANGUE_DEFAUT;
}

type Entree = { fr: string; en: string } | string;

const D: Record<string, Entree> = {
  // Le bandeau du haut, vu sur chaque écran du comptoir.
  "dateau.ouvert": { fr: "crédit ouvert", en: "credit open" },
  "dateau.comptant": { fr: "comptant seul", en: "cash only" },
  "pied.abonnement": { fr: "abonnement par semaine", en: "weekly subscription" },
  "pied.numero": { fr: "numéro non noté", en: "number not noted" },
  "pied.demo": { fr: "Démo : aucun vocal reçu, aucun débit MoMo", en: "Demo: no voice note received, no MoMo debit" },

  // La connexion.
  "entree.titre": { fr: "Le cahier de la boutique", en: "The shop notebook" },
  "entree.ouvrir": { fr: "Ouvrir le comptoir", en: "Open the counter" },
};

export function t(cle: string, langue: Langue = LANGUE_DEFAUT): string {
  const entree = D[cle];
  if (typeof entree === "string") return entree;
  if (entree) return entree[langue] ?? entree.fr;
  return cle;
}
