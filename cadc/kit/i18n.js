/**
 * Bilinguisme français / anglais, sans dépendance.
 *
 * Le français reste la langue par défaut : c'est celle du comptoir. L'anglais
 * est là pour le personnel formé en anglais des régions du Nord-Ouest et du
 * Sud-Ouest. Le choix est stocké dans un cookie lu par le serveur, donc la
 * première page rendue est déjà dans la bonne langue, sans clignotement.
 */

export const LANGUES = ["fr", "en"];
export const LANGUE_DEFAUT = "fr";
export const NOM_COOKIE = "cadc_langue";

/** Le texte par défaut quand une clé manque : on ne montre jamais la clé brute. */
export function cleManquante(cle) {
  return cle;
}

export function normaliserLangue(valeur) {
  const code = String(valeur || "").slice(0, 2).toLowerCase();
  return LANGUES.includes(code) ? code : LANGUE_DEFAUT;
}

/**
 * Fabrique un traducteur à partir d'un dictionnaire
 * `{ cle: { fr: "...", en: "..." } }`.
 *
 * t("pot.du", { montant: "15 000 FCFA" }) remplace {montant}.
 */
export function creerTraducteur(dictionnaire, langue = LANGUE_DEFAUT) {
  const code = normaliserLangue(langue);

  function t(cle, variables) {
    const entree = dictionnaire[cle];
    let texte;
    if (typeof entree === "string") {
      texte = entree;
    } else if (entree && typeof entree === "object") {
      texte = entree[code] ?? entree[LANGUE_DEFAUT] ?? cleManquante(cle);
    } else {
      texte = cleManquante(cle);
    }
    if (!variables) return texte;
    return texte.replace(/\{([a-zA-Z0-9_]+)\}/g, (mot, nom) =>
      Object.prototype.hasOwnProperty.call(variables, nom) ? String(variables[nom]) : mot,
    );
  }

  return { langue: code, t };
}

/** Un seul objet de traduction, à passer dans les composants. */
export function traduire(langue, dictionnaire) {
  return creerTraducteur(dictionnaire, langue);
}

/** Les deux mots de la bascule de langue, toujours lisibles tels quels. */
export const ETIQUETTES_LANGUE = {
  fr: { court: "FR", long: "Français" },
  en: { court: "EN", long: "English" },
};
