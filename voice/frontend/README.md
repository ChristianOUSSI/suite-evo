# CADC VOICE · console

Le poste de conduite du standard. Une page d'offre, un écran de connexion, puis
neuf écrans de travail : le tableau du matin, le journal d'appels et sa fiche,
l'appel testé, le répertoire parlé, l'agenda des guichets, la main courante, les
envois, les postes et touches, et l'établissement.

Stack : Next.js 16, App Router, React 19, TypeScript, CSS écrit à la main. Aucun
framework d'interface, aucun kit de composants.

## Démarrer

```bash
cd frontend
npm install
npm run dev            # http://localhost:3100
```

L'API doit tourner à côté, sur `http://127.0.0.1:8100` (voir `backend/README.md`).
Les requêtes `/api/*` sont réécrites vers elle par `next.config.ts` ; on change
l'adresse avec `VOICE_API_URL`.

```bash
npm run lint
npm run build
```

## Comment ça parle à l'API

Deux chemins, volontairement séparés.

Les écrans rendus côté serveur (`src/app/(console)/*/page.tsx`) passent par
`src/lib/api.ts`, qui relit le cookie de séance et le transmet tel quel. Ils ne
connaissent que des types (`src/lib/types.ts`) et n'inventent jamais un chiffre :
un tableau du matin, une plaque de postes ou un calendrier de guichet viennent de
l'API, déjà écrits en français.

Les formulaires, côté navigateur, passent par `src/lib/client-api.ts` et posent
les mêmes routes que la voix utilise quand un appelant touche un chiffre. Après
chaque écriture, la page recharge ses données (`route.refresh()`), donc ce qui
vient d'être posé au clavier réapparaît dans la liste sans rafraîchissement
manuel.

Les erreurs de l'API remontent telles quelles, en français : `Le numéro de
l'appelant est incomplet.` plutôt qu'un code.

## Les neuf écrans

| Route | Ce qu'on y fait |
| --- | --- |
| `/tableau` | La nuit écoulée, la plaque des postes, les places tenues, les fiches les plus lues, la dernière dictée entière |
| `/journal` | Toutes les fiches d'appel, filtrées par issue, poste, fenêtre ou numéro, et les cinq feuilles CSV |
| `/journal/{id}` | Une fiche seule, avec sa dictée ligne à ligne et ce qu'elle a entraîné |
| `/simulateur` | Le même moteur que la nuit : on décroche, on touche, on parle, et l'essai écrit une vraie fiche |
| `/repertoire` | Le fonds de réponses, son épreuve par question, et les trous que la voix ne sait pas dire |
| `/agenda` | Les places libres par guichet, les guichets eux-mêmes, et la feuille des rendez-vous posés |
| `/main-courante` | Les mots laissés, leurs promesses dépassées, et la note écrite à la main |
| `/envois` | Le journal des SMS et rappels, la tournée du matin, et un envoi écrit à la main |
| `/standard` | Les touches d'un poste, ses heures, ses postes, ses fermetures |
| `/reglages` | Les mots de la voix dans les deux langues, les canaux ouverts, la caisse des SMS, l'équipe |

## Le style

Trois familles, chargées en local (`src/app/fonts`) : Newsreader pour les titres
et la dictée, Karla pour le texte courant, Space Mono pour les heures, les
références et les numéros.

Le fond est sombre (`--nuit`), la couleur vient de trois tokens seulement :
ambre pour ce qui attend, mousse pour ce qui est tenu, rouille pour ce qui a
raté. Une pastille veut dire une chose, et elle la dit pareil d'un écran à
l'autre.

Les grilles sont inégales. Les panneaux se partagent l'espace en 1,28/0,72 ou
1,62/0,58 selon ce que l'écran a vraiment à montrer, jamais en colonnes de même
largeur. Les cartes se suivent sans se répéter : sur la page d'offre, la
cinquième tient sur sept colonnes pendant que les autres en prennent quatre ou
cinq.

Un fichier de style par écran (`src/styles`), plus `console.css` pour ce qui est
commun à la console. Les pages d'offre et de connexion ont le leur.

## Ce qui est simulé à l'écran

La mention `Démo` est posée là où un geste toucherait de l'argent ou un opérateur
: l'appel testé, la place posée, l'envoi poussé, la facture de l'établissement,
la tournée de relances. Une référence qui commence par `DEM` le rappelle dans les
listes.

## Vérifications

```bash
npm run lint && npm run build
npx tsc --noEmit
```

Les types du dossier `src/lib/types.ts` décrivent exactement ce que l'API rend ;
`scripts/verif_console.py`, à la racine du backend, rejoue chaque payload des
formulaires contre l'API pour vérifier que les deux côtés ne se sont pas perdus.
