import { NextResponse } from "next/server";

import { LANGUES, NOM_COOKIE } from "@cadc/kit/i18n";

/**
 * Le seul endroit qui écrit le cookie de langue. Une année de travail sur ce
 * produit se joue à ce que la première page rendue soit déjà dans la bonne
 * langue : d'où le cookie, et non un état JavaScript.
 *
 * Le retour se lit dans l'en-tête referer, et retombe sur l'accueil. On ne
 * passe pas par un champ caché : une forme POST vers cette route hérite du
 * referer du navigateur, et rien d'autre n'a besoin de le connaître.
 */
export async function POST(requete: Request) {
  const code = new URL(requete.url).searchParams.get("code") ?? "fr";
  const langue = (LANGUES as readonly string[]).includes(code) ? code : "fr";

  const entete = requete.headers.get("referer");
  let retour = "/";
  if (entete) {
    try {
      const url = new URL(entete);
      retour = `${url.pathname}${url.search}`;
    } catch {
      retour = "/";
    }
  }

  const reponse = NextResponse.redirect(new URL(retour, requete.url));
  reponse.cookies.set(NOM_COOKIE, langue, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return reponse;
}
