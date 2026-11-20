# evo-presence

Le pointage des présences. Un téléphone à l'entrée, une ligne par employé et
par jour : qui est arrivé, à quelle heure, qui est en retard, qui est absent -
et le mois que chacun peut vérifier seul, sans compte ni cahier à réclamer.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Le produit est bilingue français et anglais et pose sur le socle `@cadc/kit`
(palette CADC reprise des logos, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 8700
cd frontend && npm install && npm run dev   # http://localhost:3700
```

`npm run dev`, `npm run build` et `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs`. Cette copie est obligatoire : Turbopack ne
suit pas le lien `node_modules/@cadc/kit` sous Windows.

Comptes de démonstration : `ada@horizon.cm` et `mbarga@horizon.cm` (mot de
passe `Presence2026!`) - responsable et agent.

## Ce que fait le pointage

- **Le matin.** Une case par employé actif : trois états (présent, retard,
  absent), l'heure d'arrivée et de départ, une note. Le second pointage du
  même jour corrige le premier, il ne le double pas. On peut revenir sur une
  journée passée, jamais écrire dans le futur.
- **Les employés.** Une fiche par personne : service, numéro camerounais.
  Sortir quelqu'un de la liste n'efface rien : ses journées restent écrites.
- **Le journal.** Les dernières lignes pointées, qui a pointé et quand.
- **Le mois.** Présents, retards, absents et heures, **recalculés à chaque
  demande** - ce n'est pas un document figé. Chacun reçoit un code de
  contrôle de dix signes, stable pour un même mois.
- **Le bulletin public.** `/verifier` : l'employé tape son code, son mois
  s'affiche jour par jour, sans compte. Seul son mois se lit, jamais celui
  des collègues.
- **L'écran partagé** (`/kiosque`). Un téléphone à l'entrée : l'employé
  tape son code personnel (huit signes, stable, donné par le responsable)
  et choisit « je viens d'arriver » ou « je pars ». L'heure se prend à
  Douala (UTC+1), le second passage corrige le premier, jamais dans le
  futur. Pas de compte, pas de chef qui pointe à la place de l'employé.
- **Les exports.** Trois feuilles CSV (employés, pointages, récap mensuel)
  en point-virgule, protégées contre l'injection de formules.

## Les règles qui comptent

- **Une journée, un employé, une ligne.** La contrainte d'unicité vit dans
  la base : deux lignes le même jour doubleraient la présence.
- **L'agent pointe, le responsable décide.** Le rôle dans le compte, pas
  l'adresse, décide qui touche aux fiches et aux comptes.
- **Le mois se relit, il ne se fige pas.** Corriger une journée d'hier change
  le récap du mois, le code reste le même.

## Ce qui est vérifié

- `pytest` backend : 13 tests, dont le pointage idempotent, le refus de date
  future, le récap recalculé et le bulletin par code.
- `npm run lint`, `tsc --noEmit`, `next build` : verts.
- Parcours HTTP réel : connexion, les six écrans, le bulletin public par
  code, les exports CSV, la page en anglais.

## Ce qui reste à vérifier

- **Les clics réels au pouce** : les trois pastilles d'état et les deux
  sélecteurs d'heure sont des composants client vérifiés en logique et en
  HTTP, pas encore à la main sur un téléphone.
- **Le rendu à 375/390 px.**
- **L'impression du bulletin** (`window.print`) n'a pas été testée.

## Les décisions de fabrication

- Le backend rend des **nombres bruts, des dates ISO et des clés stables**,
  jamais de phrase : un texte fabriqué côté serveur est une langue imposée.
  Les refus portent `{code, fr, en}`, y compris les 422 de Pydantic, avec les
  noms de champs humanisés.
- Le code de contrôle est **dérivé d'un secret serveur** : il ne se devine
  pas, il ne se forge pas, et il ne livre que le mois qu'il désigne - ni les
  collègues, ni les autres services.
- La langue se lit dans un cookie côté serveur, donc le premier rendu est
  déjà dans la bonne langue. La taille du texte reste dans le téléphone,
  relue par un script avant la première peinture.
