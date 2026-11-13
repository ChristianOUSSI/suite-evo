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
    joursEntre: (a: string, b: string) => kit.joursEntre(a, b),
  };
}

export const VILLES = kit.VILLES;
export const LANGUE_PAR_DEFAUT = LANGUE_DEFAUT;

/** Un nombre de jours, dit comme on le dit au comptoir. */
export function nouvelles(jours: number | null, t: (cle: string, vars?: Record<string, string | number>) => string): string {
  if (jours === null) return t("fiche.jamais");
  if (jours <= 0) return t("fiche.aujourdhui");
  if (jours === 1) return t("fiche.hier");
  return t("fiche.jours", { n: jours });
}

/** Un retard de relance, au singulier près. */
export function retard(jours: number, t: (cle: string, vars?: Record<string, string | number>) => string): string {
  if (jours <= 0) return t("relance.due_le");
  if (jours === 1) return t("relance.retard1");
  return t("relance.retard", { n: jours });
}

/**
 * Le lien WhatsApp du comptoir : le numéro au format international, sans le
 * +, sans les espaces. C'est la seule URL que le produit fabrique.
 */
export function lienWhatsApp(telephone: string, texte?: string): string {
  const chiffres = telephone.replace(/\D/g, "");
  if (chiffres.length !== 12 || !chiffres.startsWith("237")) return "";
  const base = `https://wa.me/${chiffres}`;
  return texte ? `${base}?text=${encodeURIComponent(texte)}` : base;
}
