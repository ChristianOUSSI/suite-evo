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
export const RAILS = kit.RAILS;
export const LANGUE_PAR_DEFAUT = LANGUE_DEFAUT;

/** Un délai de paiement, dit comme on le dit au téléphone. */
export function retard(jours: number, langue: string): string {
  if (jours <= 0) return langue === "en" ? "on time" : "dans les temps";
  if (jours === 1) return langue === "en" ? "1 day late" : "1 jour de retard";
  return langue === "en" ? `${jours} days late` : `${jours} jours de retard`;
}
