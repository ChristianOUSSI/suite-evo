# PALABRE · frontend

Le carnet vu par le commerçant et par son client. Next.js 16 en App Router,
React 19, TypeScript. Pas de framework CSS, pas de bibliothèque d'icônes : les
feuilles sont écrites à la main dans `src/styles/` et les trois polices sont
servies en local depuis `public/fonts/`.

## Démarrer

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Le site attend l'API sur `http://127.0.0.1:8000`. Une réécriture interne
monte `/api/*` vers l'API, donc le navigateur ne parle jamais directement au
serveur Python : même origine, même cookie de session, aucun souci de CORS
côté client.

```bash
PALABRE_API_URL=http://127.0.0.1:8000   # où joindre FastAPI (déjà le défaut)
PALABRE_SITE_URL=http://localhost:3000  # base des URLs absolues du référencement
```

Compte de démonstration : `patron@nanafils.cm` / `Palabre2026!`.

## Routes

| Chemin | Écran |
| --- | --- |
| `/` | Présentation publique du carnet |
| `/connexion` | Ouverture de session |
| `/app` | Accueil : ce qui rentre, ce qui tarde, le point du soir |
| `/app/creances` | Le registre, filtré et trié |
| `/app/creances/{reference}` | Fiche d'une créance : relances, promesses, reçus, lien client |
| `/app/import` | Entrée en masse depuis un CSV |
| `/app/caisse` | Journal des encaissements |
| `/app/relances` | La séquence, le fil des envois, tir manuel |
| `/app/reglages` | Ton, canaux, relances automatiques, point du soir |
| `/payer/{jeton}` | L'avis de paiement vu par le client |

Le groupe `(app)` porte la navigation et l'obligation de session : chaque page
appel `requireSession()` et redirige vers `/connexion` sinon. `/payer/*` est le
seul coin du site visité par quelqu'un qui n'a pas de compte ; il est rendu
`force-dynamic` et exclut l'indexation.

## Données

Deux clients HTTP, selon le côté du mur.

- `src/lib/api.ts`, côté serveur. `apiGet` forward le cookie de session reçu et
  pose `cache: "no-store"`. Une erreur réseau remonte un `ApiError` 503 au
  message explicite, que la page d'erreur affiche plutôt qu'un écran blanc.
- `src/lib/client-api.ts`, côté navigateur. `apiCall` poste sur `/api/*`,
  même origine, mêmes cookies. Les messages d'erreur de FastAPI (`detail`, y
  compris les listes de validation Pydantic) sont traduits en une seule ligne
  française et posés sous le champ concerné.

Les pages sont des composants serveur qui lisent ; les actions qui écrivent
vivent dans des composants client (`new-invoice-form`, `invoice-tools`,
`quick-payment`, `csv-importer`, `relance-runner`, `settings-form`,
`public-pay-form`). Après une écriture, on appelle `router.refresh()` : le
serveur relit, la page se recompose, et il n'existe pas de cache local à
désynchroniser.

Les types partagés sont dans `src/lib/types.ts` et `src/lib/format.ts` (montants
en francs CFA insécables, dates françaises longues, numéros au rythme local).
Le calcul reste côté API : étiquette de statut, reste à régler, frais et mentions
de message arrivent tout faits. Le frontend ne fait que deux choses : lire un CSV
et le valider ligne à ligne avant de le présenter (`csv-importer`), et tourner les
champs de l'avis en phrases lisibles (`page.tsx` de `/payer/{jeton}`).

## Style

`src/app/globals.css` tient les variables d'encre et de papier, les `@font-face`,
et les primitives communes (boutons, tampons, étiquettes, champs, feuilles,
ossature `garde-*` des pages publiques et d'incident). Chaque univers a sa
feuille, importée par ses propres pages : `landing`, `login`, `app`, `creances`,
`entree` (import), `caisse`, `relances`, `reglages`, `payer`.

Bodoni Moda pour les titres, Archivo pour le texte, IBM Plex Mono pour les
chiffres et les références. Les montants sont en chiffres tabulaires, alignés
comme dans un registre. Les tampons « En retard », « Compte soldé », « Démonstration »
sont dessinés en CSS, pas en images.

Responsive : une colonne sous 880 px, la souche de l'avis passe au-dessus du
corps, les onglets de relance deviennent un rail qui scrolle horizontalement.
Vérifié à 390 et 375 px sans débordement horizontal du document.

Accessibilité : lien d'évitement, `main` et titres region nommés, groupes de
radios avec `aria-labelledby`, messages d'erreur en `role="status"` ou
`aria-live`, contraste papier/encre contrôlé, `prefers-reduced-motion` respecté.

## Commandes

```bash
npm run dev
npm run build
npm run start
npm run lint     # eslint, profil core-web-vitals + typescript
```

Le build rend `/` et `/connexion` en statique ; tout le reste est rendu à la
demande, parce que le carnet change selon la session, la date et le jeton reçu.

## Ce qui est simulé

Le paiement en ligne écrit un reçu et met le solde à jour dans le carnet. Il
n'appelle aucun opérateur Mobile Money et ne débite rien. Les relances sont
marquées envoyées avec une référence de démonstration. Le bandeau « Édition de
démonstration » et l'encart « Démonstration » de l'avis client le disent à
l'écran, en haut et en bas de page.
