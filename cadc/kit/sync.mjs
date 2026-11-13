// Le socle partagé se copie, il ne se lien pas.
//
// Turbopack ne suit pas les liens Windows créés dans node_modules : le build
// échouait sur « Can't resolve '@cadc/kit' » alors que Node et TypeScript,
// eux, trouvaient le fichier. Copier des fichiers réels règle les trois
// outils d'un coup, et les scripts predev/prebuild rendent la dérive
// impossible : à chaque ouverture du produit, le socle est à jour.
//
// Les fontes suivent le même chemin, mais dans public/fonts : c'est là que le
// navigateur vient les chercher.

import { cpSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const source = dirname(fileURLToPath(import.meta.url));
const racine = process.cwd();

const FICHIERS = [
  "package.json",
  "index.js",
  "index.d.ts",
  "i18n.js",
  "i18n.d.ts",
  "cameroun.js",
  "cameroun.d.ts",
  "theme.css",
];

function copierSocle(cible) {
  try {
    const existant = lstatSync(cible);
    if (existant.isSymbolicLink()) {
      // On casse le lien, jamais ce qu'il désigne.
      rmSync(cible, { recursive: false, force: true });
    }
  } catch {
    // Rien en place : la copie créera le dossier.
  }
  mkdirSync(cible, { recursive: true });
  for (const un of FICHIERS) {
    cpSync(join(source, un), join(cible, un), { force: true });
  }
}

const socle = join(racine, "node_modules", "@cadc", "kit");
copierSocle(socle);

const fontes = join(racine, "public", "fonts");
mkdirSync(fontes, { recursive: true });
cpSync(join(source, "fonts"), fontes, { recursive: true, force: true });

console.log(`socle et fontes en place : ${socle}`);
