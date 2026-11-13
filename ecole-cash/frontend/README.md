# ÉCOLE CASH · frontend

La caisse vue par la caissière, par la directrice, et par le parent qui vérifie
un reçu. Next.js 16 en App Router, React 19, TypeScript strict. Pas de
framework CSS, pas de bibliothèque d'icônes, pas de dépendance runtime : les
feuilles sont écrites à la main dans `src/styles/` et les trois polices sont
servies en local depuis `public/fonts/`.

## Démarrer

```bash
cd frontend
npm install
npm run dev        # http://localhost:3200
```

La caisse attend l'API sur `http://127.0.0.1:8200`. Une réécriture interne monte
`/api/*` vers l'API, donc le navigateur ne parle jamais directement au serveur
Python : même origine, même cookie de session, aucun réglage CORS côté client.

```bash
CASH_API_URL=http://127.0.0.1:8200  # où joindre FastAPI (déjà le défaut)
CASH_SITE_URL=http://localhost:3200 # base des URLs absolues du référencement
```

Compte de démonstration : `caisse@tilleuls.cm` / `Caisse2026!`.

## Routes

| Chemin | Écran |
| --- | --- |
| `/` | Présentation publique de la caisse |
| `/connexion` | Ouverture de séance |
| `/app` | Tableau de bord : caisse du jour, recouvrement, retards à traiter |
| `/app/guichet` | Encaissement, recherche famille, rails, ardoise du jour |
| `/app/eleves` | Le cahier des familles, filtré par classe ou par retard |
| `/app/eleves/nouvel` | Inscrire un élève et poser son échéancier |
| `/app/eleves/{id}` | Fiche d'une famille : termes, versements, reçus, avis |
| `/app/classes` | Classes, barèmes et engagement de l'année entière |
| `/app/relances` | File des avis, réglage du rythme, tir manuel, texte avant envoi |
| `/app/recus` | Reçus émis, état du canal, renvoi, jeton de vérification |
| `/app/journal` | Déclarations de caisse jour par jour, comptage du soir, feuilles CSV |
| `/app/reglages` | Mots de l'école, calendrier, ton et délais, rails, équipe, exports |
| `/verif/{jeton}` | Le reçu vu par le parent, sans compte |

Le groupe `(app)` porte la navigation et l'obligation de séance. La porte se lit
dans la layout elle-même, parce qu'une page d'erreur ne peut pas rattraper la
layout de son propre segment : sans séance, `redirect("/connexion")` ; si l'API
ne répond pas, la layout rend `EcranIncident` en français plutôt que l'écran du
framework. Chaque page appelle ensuite `seanceObligatoire()`, et les incidents
qui ne viennent que d'une feuille de données tombent dans `(app)/error.tsx`.
`/verif/*` est le seul coin visité par quelqu'un qui n'a pas de compte ; il est
rendu `force-dynamic` et exclu de l'indexation. Les trois bornes
(`(app)/error.tsx`, `app/error.tsx`, `app/global-error.tsx`) n'affichent jamais
`error.message` : un message technique de React ou un digest n'est pas une
information pour une caissière.

## Données

Deux clients HTTP, selon le côté du mur.

- `src/lib/api.ts`, côté serveur. `lire` et `lireOuRien` forwardent le cookie
  `cash_session` et posent `cache: "no-store"`. Une erreur réseau remonte une
  `ErreurCaisse` 503 au message explicite.
- `src/lib/client-api.ts`, côté navigateur. `ecrire` poste sur `/api/*`, même
  origine, mêmes cookies. Les `detail` de FastAPI, y compris les listes de
  validation Pydantic, sont traduits en une ligne française posée sous le champ
  concerné. Quand la réécriture Next ne joint pas l'API, la réponse est un 500
  en texte brut : sans JSON, le message dit que la caisse ne répond pas, au lieu
  de répéter un statut incompréhensible.

Les pages sont des composants serveur qui lisent ; les écritures vivent dans des
composants client (`guichet`, `formulaire-eleve`, `actions-eleve`,
`classes-console`, `comptage`, `pilotage-relances`, `relances-outils`,
`formulaire-reglages`, `equipe-console`, `bouton-annulation`,
`bouton-sortie`). Après une écriture, `router.refresh()` : le serveur relit, la
page se recompose, il n'existe pas de cache local à désynchroniser. Le guichet
fait exception : il met à jour ses propres cartes avec la réponse du
receveur, pour que le geste reste sous la main le temps d'un encaissement.

Les miroirs de charge utile sont dans `src/lib/types.ts`, les formats dans
`src/lib/format.ts`. Le calcul reste à l'API : chaque montant arrive avec son
`*_label`, chaque statut avec son étiquette, chaque texte de message déjà écrit.
Le frontend ne fait que trois choses : lire, trier ce qu'il a sous les yeux, et
canoniser un numéro en neuf chiffres avant de l'envoyer.

Trois quirks du contrat sont assumés en code, pas en prose :

- Le backend n'a pas de préfixe `/api` : le chemin `/api/...` n'existe que par
  la réécriture Next, et les appels serveur vont à `/dashboard`, `/eleves`...
- L'état d'un reçu coupé s'écrit `coupé`, avec son accent, et sert de clé de
  filtre.
- `PUT /settings` attend le modèle complet de l'école : le formulaire de
  réglages préremplit donc les dix-neuf champs, y compris ceux qu'on ne touche
  pas.

## Style

`src/app/globals.css` tient les variables d'encre et de papier, les
`@font-face`, et les primitives communes (boutons, tampons, étiquettes, champs,
cases à cocher, avis, feuilles vides, ossature `shell` / `vitre`). Chaque
univers a sa feuille, importée par ses propres pages : `entree`, `landing`,
`app`, `tableau`, `guichet`, `eleves`, `classes`, `relances`, `journal`,
`reglages`.

Fraunces pour les titres, Barlow pour le texte, JetBrains Mono pour les chiffres
et les références. L'encre est un vert de carnet (`#12312a`) sur papier sauge
pâle, le tampon en terre cuite, jamais de violet ni de dégradé. Les montants
sont en chiffres tabulaires, alignés comme dans un registre. Les coins sont
droits, les ombres sont des décalages pleins, les grilles ont des pistes inégales
: la feuille doit avoir l'air faite main, pas sortie d'un gabarit.

Responsive : la navigation passe en rail qui scrolle sous 980 px, les tables
deviennent des piles sous 720 px, la grille de caisse passe à deux pistes puis
une sous les mêmes seuils. Les cibles tactiles font au moins 2,75 rem.

Accessibilité : lien d'évitement, `main` et sections nommées, `aria-current` sur
la route active, avis en `role="alert"` et confirmations en `role="status"`,
radio et cases masquées mais dessinées, `prefers-reduced-motion` respecté.

## Commandes

```bash
npm run dev
npm run build
npm run start
npm run lint     # eslint, profil core-web-vitals + typescript
```

`/` et `/connexion` peuvent être rendus en statique ; tout le reste est rendu à
la demande, parce que la caisse change selon la séance, la date et le jeton reçu.
Chaque page protégée pose `export const dynamic = "force-dynamic"`.

## Ce qui est simulé

Aucun écran n'appelle un opérateur. Un encaissement écrit un reçu dans la base
de démonstration ; une relance est marquée envoyée avec une référence de
démonstration ; un comptage écrit un écart dans le journal. La mention « Démo »
se pose sur le geste qui serait une vraie transaction (sous le bouton du
guichet, sur la file de relances, à l'ouverture de séance), pas seulement en
pied de page.

## Ce qui est vérifié, ce qui ne l'est pas

Vérifié sur le poste, le 31 octobre 2026, avec un Node 24.22.2 portable :
`npm run lint` sans erreur ni warning, `tsc --noEmit` propre, `next build` vert
(quinze routes, dont `/`, `/connexion` et `/icon.svg` en statique), serveur
produit lancé et quatre écrans lus dans le DOM : `/`, `/connexion`, `/app`,
`/verif/DEMO-JETON`. Les polices locales se chargent, le fond papier et les
trois bornes d'incident rendent bien en français.

Non vérifié : les douze écrans protégés, parce que le backend n'a pas tourné
(Python absent du PATH). Leur structure de données a été relue contre
`backend/app/routers/` et `backend/app/services/present.py`, mais aucun n'a été
rempli par la base de démonstration. La revue visuelle (couleurs, pistes de
grille, débordements à 390 et 375 px) reste à faire dans un navigateur
affichable : les vérifications ci-dessus ont été menées sur le DOM, la surface
graphique du navigateur interne n'étant pas visible.
