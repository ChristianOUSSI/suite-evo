// Langue du produit : français d'abord, anglais ensuite.
// Module sans dépendance serveur : importable côté client et côté serveur.

export type Langue = "fr" | "en";

export const LANGUES: readonly Langue[] = ["fr", "en"];
export const LANGUE_DEFAUT: Langue = "fr";
export const NOM_COOKIE = "ecole_langue";

export function normaliserLangue(valeur: string | null | undefined): Langue {
  return valeur === "en" ? "en" : LANGUE_DEFAUT;
}

const D: Record<string, { fr: string; en: string }> = {
  // Le chrome de l'espace.
  "dateline.annee": { fr: "{annee} · {sigle}", en: "{annee} · {sigle}" },
  "pied.abonnement": { fr: "abonnement {label}/mois", en: "subscription {label}/month" },
  "pied.demo": { fr: "Démo : aucun SMS, aucun débit MoMo", en: "Demo: no SMS, no MoMo debit" },
  "pied.edition": { fr: "édition de démonstration", en: "demo edition" },
  "sortie.ranger": { fr: "Ranger", en: "Sign out" },
  "sortie.rangement": { fr: "Rangement", en: "Signing out" },
  "marque.sous": { fr: "le cahier de l'école", en: "the school notebook" },
  "incident.ferme": { fr: "Caisse fermée", en: "Till closed" },
  "incident.titre": { fr: "La caisse de l'école ne répond pas.", en: "The school till is not responding." },
  "incident.message": { fr: "Le registre n'a pas pu être ouvert. Vérifie que l'API tourne sur le port attendu, puis repasse par ici.", en: "The register could not be opened. Check that the API is running on the expected port, then come back." },
  "incident.repasser": { fr: "Repasser", en: "Try again" },
  "incident.rouvrir": { fr: "Rouvrir la séance", en: "Reopen the session" },
  "nav.aria": { fr: "Navigation de la caisse", en: "Till navigation" },
  "nav.tableau": { fr: "Tableau", en: "Board" },
  "nav.guichet": { fr: "Guichet", en: "Counter" },
  "nav.eleves": { fr: "Élèves", en: "Students" },
  "nav.classes": { fr: "Classes", en: "Classes" },
  "nav.relances": { fr: "Relances", en: "Reminders" },
  "nav.recus": { fr: "Reçus", en: "Receipts" },
  "nav.journal": { fr: "Journal", en: "Journal" },
  "nav.reglages": { fr: "Réglages", en: "Settings" },
  "sortie.fermer": { fr: "Fermer la caisse", en: "Close the till" },
  "sortie.fermeture": { fr: "Fermeture", en: "Closing" },
};

// Lecture côté client (composants "use client" sans parent serveur) :
// le cookie posé par le commutateur. Absent ou illisible → français.
export function langueDepuisCookie(): Langue {
  if (typeof document === "undefined") return LANGUE_DEFAUT;
  const brut = document.cookie
    .split("; ")
    .find((une) => une.startsWith(`${NOM_COOKIE}=`))
    ?.split("=")[1];
  return normaliserLangue(brut ? decodeURIComponent(brut) : null);
}

export function t(
  cle: string,
  langue: Langue = LANGUE_DEFAUT,
  variables?: Record<string, string | number>,
): string {
  const entree = D[cle];
  let texte: string;
  if (entree) texte = entree[langue] ?? entree.fr;
  else texte = cle;
  if (!variables) return texte;
  return texte.replace(/\{([a-zA-Z0-9_]+)\}/g, (mot, nom) =>
    Object.prototype.hasOwnProperty.call(variables, nom) ? String(variables[nom]) : mot,
  );
}
