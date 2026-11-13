# evo-crm

Le carnet qui se souvient. Une PME camerounaise ne perd pas ses clients par
manque de marché : elle les perd par silence. Le carnet tient la fiche de
chaque client, ce qui s'est dit, et la liste de qui rappeler ce matin.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Bilingue français et anglais, posé sur le socle `@cadc/kit` (palette CADC
reprise des logos, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 8600
cd frontend && npm install && npm run dev   # http://localhost:3600
```

`npm run dev`, `npm run build`, `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs` : le socle est copié en fichiers réels dans
`node_modules/@cadc/kit` et les fontes dans `public/fonts`. Sans cette copie,
Turbopack ne suit pas le lien Windows du paquet et le build échoue.

Deux comptes de démonstration, mot de passe `Carnet2026!` :
`kelly@etsmama.cm` (responsable, écrit les réglages et sort une fiche) et
`yves@etsmama.cm` (vendeur, journal et relances seulement).

## Ce qui a été vérifié en réel (9 novembre 2026)

- `python -m pytest` : 20 tests passent, dont la reprise qui pousse toute
  seule après un devis, le motif obligatoire, le client sorti qui refuse le
  journal, la recherche sur un seul champ, l'injection de formule dans un CSV,
  et le client sans numéro qui ne casse plus l'unicité.
- `npm run lint` : 0 erreur, 0 warning. `npx tsc --noEmit` : 0 erreur.
  `npm run build` : 11 routes.
- Les 14 combinaisons route × langue relues dans le DOM rendu rendent 200, et
  la route inconnue rend 404 en français comme en anglais, sans fuite de clé de
  traduction et sans glyphe Unicode.
- Cycle rejoué contre l'API qui tourne : ajout d'une fiche avec un numéro écrit
  à la main (`0699 44 55 66` devenu `+237699445566`, réseau calculé), devis à
  120 000 F, relance née du devis à J+7 sans motif stocké, clôture de cette
  relance le jour même, refus 403 du vendeur sur les réglages, refus 422 de la
  relance sans raison, recherche par nom.
- Rôles lus à l'écran : le vendeur ne voit ni « Nouvelle fiche » ni « Sortir du
  carnet », et la page de réglages affiche l'avertissement de droit.
- Mesures prises dans le navigateur : 14 fiches rendu, 5 relances dont 3 rails
  rouges, aucune cible tactile sous 44 px, aucun débordement horizontal, les
  trois fontes demandées en 200.

## Ce qui reste à vérifier

- **Les clics réels.** La surface du navigateur intégré est restée cachée :
  le DOM et les styles computed se mesurent, mais React n'hydrate pas une page
  invisible, donc « Noter un échange », « C'est fait » et la bascule de langue
  n'ont pas été testés au pouce. Les mêmes actions ont été jouées en HTTP
  direct contre l'API et en pytest.
- **Le rendu à 390 et 375 px** : non mesuré, le viewport fourni valait 0 et la
  largeur de document oscillait selon les pages. Les points d'arrêt existent
  (700, 640 et 560 px) ; leur effet réel reste à regarder.
- `tel:` et `wa.me:` ouvrent l'application du téléphone : rien n'a été vérifié
  sur un appareil réel.

## Les décisions de fabrication

- **Le numéro est la clé de la fiche.** Il se canonise à l'entrée, et deux
  fiches ne le partagent pas. L'unicité est un index partiel (`telephone <> ''`) :
  sinon un carnet ne peut pas tenir deux clients joints seulement par
  courriel, ce que la première version cassait en 500.
- **Une reprise a une raison.** Une relance posée par un humain porte son
  motif ; une relance née d'un devis ne porte qu'un code `origine`, et
  l'écran le dit dans la langue choisie. Aucune phrase française ne dort dans
  la base.
- **Le seuil de silence est un réglage, pas une vérité.** Au-delà du nombre de
  jours choisi, le client monte seul dans la liste des oubliés. Un client sans
  numéro en est exclu : on ne peut pas le rappeler, et le montrer ferait
  croire à un travail à faire là où il n'y en a aucun.
- **Les refus parlent les deux langues**, y compris les 422 de validation,
  avec le nom humain du champ (« le numéro », jamais `telephone`).
- **Le chercheur est un formulaire HTML** : `method="get"`, aucune goutte de
  JavaScript. Sur un téléphone à 25 000 F, ce qui marche sans hydratation est
  ce qui marche.
- **La relance se clôt ou se déplace, jamais les deux à la fois** : deux
  gestes séparés, parce qu'ils n'écrivent pas la même chose dans le cahier.
