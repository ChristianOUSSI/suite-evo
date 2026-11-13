import { useSyncExternalStore } from "react";

import { NOM_COOKIE, normaliserLangue } from "@cadc/kit/i18n";

/**
 * Les deux préférences qui se gardent dans le téléphone, pas dans le compte.
 *
 * `useSyncExternalStore` et non un effet : la taille du texte et la langue se
 * lisent au premier rendu, sans second passage qui ferait danser l'écran.
 * C'est aussi ce qui permet de les lire dans un écran d'erreur, où le serveur
 * n'a plus rien à dire sur la langue choisie.
 */

const EVENEMENT = "cadc-preference";
const CLE_TEXTE = "cadc_texte";

function ecouter(recoudre: () => void) {
  const refaire = () => recoudre();
  window.addEventListener("storage", refaire);
  window.addEventListener(EVENEMENT, refaire);
  return () => {
    window.removeEventListener("storage", refaire);
    window.removeEventListener(EVENEMENT, refaire);
  };
}

export function ecrirePreference(cle: string, valeur: string) {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    // Un navigateur privé refuse parfois le stockage : la séance suffit.
  }
  window.dispatchEvent(new Event(EVENEMENT));
}

function lireTaille(): string {
  try {
    return window.localStorage.getItem(CLE_TEXTE) ?? "normal";
  } catch {
    return "normal";
  }
}

export function useTailleTexte(): string {
  return useSyncExternalStore(ecouter, lireTaille, () => "normal");
}

export function changerTailleTexte(cle: string) {
  ecrirePreference(CLE_TEXTE, cle);
  document.documentElement.setAttribute("data-texte", cle);
}

function lireLangue(): "fr" | "en" {
  const ligne = document.cookie
    .split("; ")
    .find((un) => un.startsWith(`${NOM_COOKIE}=`));
  return normaliserLangue(ligne ? decodeURIComponent(ligne.slice(NOM_COOKIE.length + 1)) : "fr");
}

export function useLangueChoisie(): "fr" | "en" {
  return useSyncExternalStore(ecouter, lireLangue, () => "fr");
}
