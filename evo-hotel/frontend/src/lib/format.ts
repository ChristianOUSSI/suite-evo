import * as kit from "@cadc/kit";
import { LANGUE_DEFAUT, normaliserLangue } from "@cadc/kit/i18n";

/**
 * Les formats du Cameroun, dans la langue de l'écran.
 * Le socle partagé porte les règles ; ici on ne fait que coller la langue.
 */

export type { Langue } from "@cadc/kit/i18n";

export function formats(langue: string) {
  const code = normaliserLangue(langue);
  return {
    langue: code,
    fcfa: (montant: number) => kit.fcfa(montant, code),
    court: (montant: number) => kit.fcfaCourt(montant, code),
    pourcentage: (valeur: number) => kit.pourcentage(valeur, code),
    date: (valeur: string | Date) => kit.dateLongue(valeur, code),
    jourDate: (valeur: string | Date) => kit.jourEtDate(valeur, code),
    heure: (valeur: string | Date) => kit.heureLocal(valeur, code),
    telephone: (valeur: string) => kit.afficheTelephone(valeur),
    canonique: (valeur: string) => kit.canoniseTelephone(valeur),
    operateur: (valeur: string) => kit.operateur(valeur),
    initiales: (valeur: string) => kit.initiales(valeur),
    salutation: () => kit.salutation(code),
    aujourdhui: () => kit.aujourdhui(),
    dansJours: (n: number) => kit.dansJours(n),
    joursEntre: (a: string, b: string) => kit.joursEntre(a, b),
    moisCourant: () => kit.aujourdhui().slice(0, 7),
    /** « novembre 2026 » / « November 2026 », pour une période « 2026-11 ». */
    moisDe: (periode: string) => {
      const date = new Date(`${periode}-01T00:00:00Z`);
      return new Intl.DateTimeFormat(code === "en" ? "en-GB" : "fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
    },
  };
}

export const VILLES = kit.VILLES;
export const LANGUE_PAR_DEFAUT = LANGUE_DEFAUT;

/** Les trois états d'une journée, dans l'ordre du portail. */
export const ETATS = ["present", "retard", "absent"] as const;

/** Une demi-journée se lit « 0,5 » et non « 0.5 » en français. */
export function jours(valeur: number, langue: string): string {
  return normaliserLangue(langue) === "fr"
    ? String(valeur).replace(".", ",")
    : String(valeur);
}

/** Le dimanche ne se pointe pas : la case du portail doit le dire. */
export function estDimanche(iso: string): boolean {
  const jour = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return jour.getDay() === 0;
}

/**
 * Le lien WhatsApp du bureau : le numéro au format international, sans le +,
 * sans les espaces. C'est la seule URL que le produit fabrique.
 */
export function lienWhatsApp(telephone: string, texte?: string): string {
  const chiffres = telephone.replace(/\D/g, "");
  if (chiffres.length !== 12 || !chiffres.startsWith("237")) return "";
  const base = `https://wa.me/${chiffres}`;
  return texte ? `${base}?text=${encodeURIComponent(texte)}` : base;
}
