# KOLO BOUTIQUE · frontend

Le comptoir vu par le tenancier et par la vendeuse. Next.js 16 en App Router,
React 19, TypeScript strict. Aucune dépendance d'interface : les feuilles sont
écrites à la main dans `src/styles/`, les icônes sont tracées en SVG dans
`src/components/icone.tsx`, et les trois polices sont servies en local depuis
`public/fonts/`.

## Démarrer

```bash
cd frontend
npm install
npm run dev        # http://localhost:3400
```

La page attend l'API sur `http://127.0.0.1:8300`. Une réécriture interne monte
`/api/*` vers l'API : le navigateur ne parle jamais directement au serveur
Python, même origine, même cookie de séance, rien à régler côté CORS.

```bash
KOLO_API_URL=http://127.0.0.1:8300   # où joindre FastAPI (déjà le défaut)
KOLO_SITE_URL=http://localhost:3400  # base des URLs absolues du référencement
```

Compte de démonstration : `tenanciere@tchuentecahier.cm` / `Kolodo2026!`.

## Routes

| Chemin | Écran |
| --- | --- |
| `/` | Présentation publique du comptoir |
| `/connexion` | Ouverture de séance |
| `/comptoir` | La journée : chiffre, bénéfice, marge, sept jours, ce qui baisse |
| `/comptoir/dictee` | La phrase du comptoir, écoutée puis écrite |
| `/comptoir/rayon` | Les lignes du rayon, leur prix, leur seuil, les rachats |
| `/comptoir/sorties` | Le journal des ventes, la vente au comptoir, les dépenses |
| `/comptoir/tiroir` | Le comptage du soir, quatorze jours, quatre feuilles CSV |
| `/comptoir/reglages` | Les mots de la boutique, les rails, les mains |

Le groupe `(comptoir)` porte le bandeau, le rail de navigation et l'obligation
de séance.

## Ce que le backend décide, et ce que l'interface montre

Le frontend ne calcule rien qui soit déjà dans l'API. Il montre des étiquettes
toutes faites (`*_label`), un coût moyen qui a été remélangé à l'entrée, un
bénéfice figé à la vente. Trois lectures viennent quand même de ce côté-ci du
mur, et elles sont écrites ici parce qu'elles engagent :

- **L'écart du tiroir reste muet tant que rien n'est compté.** L'attendu est
  connu dès la première vente, mais afficher « -2 700 FCFA » avant la saisie
  ferait croire à un trou. Le champ dit « à compter » jusqu'au premier chiffre
  tapé (`components/comptage-tiroir.tsx`).
- **La dictée se relit avant d'être écrite.** `POST /dictee/analyse` rend
  l'article, la quantité, le prix et le reste au rayon ; le bouton d'écriture
  reste fermé tant que le backend répond un doute.
- **Un rail coupé ne se propose pas.** Le tenancier qui ferme Orange Money voit
  trois rails au comptoir, pas quatre avec un message d'erreur après.

## Séance et données

Un cookie httpOnly suffit : le front ne stocke aucun jeton, ni dans
`localStorage` ni dans une variable. `src/lib/api.ts` porte le cookie à l'API
côté serveur (`cache: "no-store"`), `src/lib/client-api.ts` poste à travers la
réécriture côté navigateur, `credentials: "same-origin"`.

Quatre choses ont été apprises en construisant et sont intégrées au code :

- Une réécriture Next qui ne joint pas FastAPI rend un **500 en texte brut**.
  Sans JSON, le message dit que le comptoir est injoignable, et non un
  « la demande n'a pas pu aboutir » muet.
- Le garde de séance se lit **dans la layout**, et la layout rend elle-même
  l'écran d'incident (`components/ecran-incident.tsx`) : une `error.tsx` ne peut
  pas rattraper la layout de son propre segment, sinon c'est l'écran du
  framework, en anglais, que lit le tenancier.
- Les trois bornes (`(comptoir)` via l'incident de layout, `app/error.tsx`,
  `app/global-error.tsx`) n'affichent **jamais** `error.message`. Un digest ou
  une erreur compressée de React n'est pas une information pour un comptoir.
- `PUT /boutique` attend le **modèle complet** : le formulaire de réglages
  préremplit les douze champs, y compris ceux qu'on ne touche pas.

## Style

`src/app/globals.css` tient les tokens (sable, encre de caisse, brique, vert de
rayon, indigo), les neuf `@font-face` et les primitives : `.bouton`, `.champ`,
`.cochet`, `.note-bas`, `.tampon`, `.etiquette`, `.feuille`, `.ligne-reglure`,
`.vide`, gabarits `.gabarit` / `.vitre`. Chaque univers a sa feuille : `app.css`
(bandeau, rail, compte), `entree.css` (présentation et séance), `comptoir.css`
(journée, dictée, rayon, ventes, tiroir, réglages).

**Instrument Serif** pour les titres, **Public Sans** pour le texte, **Red Hat
Mono** pour les montants et les repères. Papier sable chaud, encre marron de
caisse. Aucune surface claire ne dépasse 0,941 de luminance : `--feuille` est à
#f6f1e7 (0,883) et `--feuille-nette`, réservée aux champs de saisie et au texte
posé sur fond sombre, à #fbf8f2. Le blanc éclatant a été retiré de la palette.
Contrastes calculés, tous au-dessus du AA : corps 14,38:1, texte sur bouton
15,27:1, encre douce 8,29:1, petites étiquettes capitales 6,13:1, brique sur
lave de brique 4,69:1 (le plus juste des couples, à surveiller si un libellé
devient plus petit). Coins droits, ombres décalées pleines, pistes de grille
inégales : la journée en `1.45fr 1fr 0.75fr` à 1240 px, les compteurs en
`1.3fr 1fr 0.7fr`, la présentation en quatre pistes disjointes.

Points de rupture vérifiés par résolution réelle des media queries (styles
calculés, element par element, à 375 / 760 / 1000 / 1240 px) : une colonne et
rail de navigation qui scrolle à 375, `1.2fr 1fr` à 760 et 1000, les trois
pistes inégales complètes à 1240. Le titre suit son `clamp` de 33,75 px à
54,56 px. Les trois familles sont chargées et distinctes : mesurées sur le même
mot à 40 px, Instrument Serif rend 295 px contre 373 px pour son repli Times New
Roman, Public Sans 423 px, Red Hat Mono 504 px.

Responsive à 1080, 980 et 720 : sous 720 le tableau du rayon devient une pile de
lignes, la journée passe en une colonne. Les cibles tactiles font au moins 2,75
rem.

Accessibilité : lien d'évitement, `main` et sections nommées, `aria-current` sur
la route active, avis en `role="alert"` et confirmations en `role="status"`,
cases masquées mais dessinées, `prefers-reduced-motion` respecté.

## Commandes

```bash
npm run dev
npm run build
npm run start
npm run lint     # eslint, profil core-web-vitals + typescript
```

`/`, `/connexion` et `/icon.svg` sont rendus en statique ; tout le reste à la
demande, parce que le comptoir change selon la séance et le jour. Chaque page
protégée pose `export const dynamic = "force-dynamic"`.

## Vérifié, et ce qui ne l'est pas

Vérifié le 5 novembre 2026, avec un Node 24.22.2 portable : `npm install`, `npm
run lint` et `npm run build` sans erreur ni warning, `tsc --noEmit` propre, dix
routes rendues. Séance ouverte en réel, les six écrans du comptoir lus dans le
DOM avec les données de démonstration (aucun `undefined`, aucun `NaN`, zéro
glyphe), dictée `4 spaghetti 700 momo` passée par `/api/dictee` : l'article, le
rail MoMo et les 2 800 FCFA ressortent au journal, et le stock tombe de 53 à 49.

**Ce qui reste non vérifié : le rendu à l'œil.** Le navigateur interne de l'app
n'expose toujours pas de surface attachée (`visible=false`, aucun
`requestAnimationFrame` quand il est masqué) : les captures, les clics réels dans
la console de dictée et la mesure des débordements par géométrie restent à faire.
Tant que la surface est masquée, deux pièges de mesure se présentent et il faut
les connaître : toute hauteur d'élément remonte à 0 (donc un contrôle de
débordement par `getBoundingClientRect` est vide de sens, il ne prouve rien), et
les polices ne sont jamais demandées réseau, parce qu'aucun glyphe visible ne
les réclame. Les deux ont piégé cette revue avant d'être identifiés.

Le contrôle des polices se fait donc en forçant un élément visible : les trois
familles se chargent alors et se distinguent à la mesure. Le reste (couleurs,
contrastes, media queries) se lit dans les styles calculés, qui ne dépendent pas
du rendu.
