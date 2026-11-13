# evo-tontine

Le cercle qui cotise. Un njangi de quartier tenu sur un téléphone : qui a
payé, qui reçoit ce mois-ci, et le code que chacun peut vérifier seul.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Le produit est bilingue français et anglais et pose sur le socle `@cadc/kit`
(palette CADC reprise des logos, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 8500
cd frontend && npm install && npm run dev   # http://localhost:3500
```

`npm run dev`, `npm run build` et `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs`. Cette copie est obligatoire : Turbopack ne
suit pas le lien `node_modules/@cadc/kit` sous Windows et échouait sur
« Can't resolve '@cadc/kit' » alors que Node et TypeScript trouvaient le
fichier. Les fontes partent dans `public/fonts` en même temps.

Deux comptes de démonstration, mot de passe `Tontine2026!` :
`tresoriere@njangi.cm` qui écrit, `lecteur@njangi.cm` qui lit sans rien écrire.

## Ce qui a été vérifié en réel (9 novembre 2026)

- `python -m pytest` : 14 tests passent, dont le tirage revérifié depuis la
  graine, la pénalité écrite une seule fois, le refus de remise sur pot
  incomplet, et deux tests ajoutés ici : `la preuve se relit à tout moment`
  et `le dernier tour remis porte son reçu`.
- `npm run lint` : 0 erreur. `npx tsc --noEmit` : 0 erreur. `npm run build` :
 la compilation passe, 12 routes.
- Les 18 combinaisons route × langue rendent 200 sans écran d'incident :
  `/`, `/connexion`, `/cercle`, `/tours`, `/tours/7`, `/membres`, `/reglages`,
  `/verif`, `/verif/[jeton]` en français et en anglais.
- Le cycle complet joué contre l'API réelle : tirage du tour 7 (gagnant
  « Estelle Nkoussa », rang 4 sur 9, graine publique rendue), encaissement des
  deux parts dues (20 000 et 10 000 FCFA), remise du pot (jeton
  `LVL9C2HRCQ`), puis relecture du reçu public sans cookie de séance.
- `html lang` bascule avec le cookie `cadc_langue` dès le premier octet ; le
  texte anglais sort bien en anglais (« Round pool », « November 5, 2026 »).
- Zéro glyphe Unicode et zéro emoji dans le HTML rendu (les icônes sont des
  SVG au trait).
- Les cibles tactiles du bandeau (A / A / A, FR / EN, logo) étaient à 35-36
  px mesurés dans le navigateur : corrigé dans le socle à `--cadc-cible`
  (48 px), puis vérifié à 0 cible sous 44 px.

## Ce qui reste à vérifier

- **Les clics réels.** La surface du navigateur intégrée n'était pas visible
  pendant cette session : le DOM se charge, les styles computed et les
  mesures de mise en page sortent, mais React n'hydrate pas une page cachée
  (`visibilityState: hidden`), donc `Tirer au sort`, `Enregistrer la part` et
  la bascule de langue n'ont pas été testés au pouce. Les mêmes actions ont
  été jouées en HTTP direct contre l'API et en pytest.
- **Le rendu à 390 et 375 px.** Non mesuré : le viewport fourni valait 0, et
  une largeur de document oscillait entre 218 et 524 px selon les pages. Les
  points d'arrêt CSS existent (760 px et 560 px), leur effet réel reste à
  regarder.
- **L'impression du reçu** (`window.print`) n'a pas été testée.

## Les décisions de fabrication

- Le backend rend des **nombres bruts, des dates ISO et des clés stables**, et
  jamais de phrase construite : un texte fabriqué côté serveur est une langue
  imposée. Les refus portent `{code, fr, en, vars}`, y compris les 422 de
  Pydantic, traduits par le même pont, avec les noms de champs humanisés
  (« le mot de passe », pas `mot_de_passe`).
- Le tirage est **revérifiable** : `sha256(graine) modulo le nombre de membres
  actifs triés par nom`, la graine étant `nom du cercle|tour N|date`. La preuve
  se relit à tout moment (`GET /tours/{id}/tirage`), pas seulement à la seconde
  du tirage. Si la liste des membres a bougé depuis, l'écran le dit au lieu de
  laisser croire que le calcul colle.
- Un 404 de `etat.tour_courant` ne fait pas disparaître le reçu : `etat.dernier`
  porte la remise, sinon la trésorière perd sa preuve juste après l'avoir
  écrite.
- La langue se lit dans un cookie côté serveur, donc le premier rendu est déjà
  dans la bonne langue. La taille du texte reste dans le téléphone, relue par
  un script avant la première peinture.
- `t()` n'est jamais passé en prop d'un serveur vers un client : React 16/19 le
  refuse et la page tombe en 500. Chaque composant client reçoit `langue` et
  construit son traducteur.
