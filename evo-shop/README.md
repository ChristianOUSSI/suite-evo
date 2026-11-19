# evo-shop

Le point de vente de la boutique. Un téléphone sur le comptoir : le ticket
qui se fige, le stock qui descend tout seul, le mois que le patron relit -
sans caisse enregistreuse.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Le produit est bilingue français et anglais et pose sur le socle `@cadc/kit`
(palette CADC reprise des logos, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 8900
cd frontend && npm install && npm run dev   # http://localhost:3900
```

`npm run dev`, `npm run build` et `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs`. Cette copie est obligatoire : Turbopack ne
suit pas le lien `node_modules/@cadc/kit` sous Windows.

Comptes de démonstration : `ada@quincaillerie.cm` (responsable) et
`mbarga@quincaillerie.cm` (caissier), mot de passe `Shop2026!`.

## Ce que fait la caisse

- **La caisse** (`/ventes`). On touche l'article, la quantité, c'est fini.
  Le total se calcule seul, le stock descend à la validation. Un ticket
  annulé rend le stock et garde la trace - on ne réécrit pas le passé.
- **Les articles** (`/produits`). Prix d'achat, prix de vente, stock, seuil
  d'alerte. Le caissier vend, le responsable seul touche aux prix.
- **La réassort** (`/produits`). Une quantité ajoutée, la fiche garde la
  trace dans sa note.
- **Le mois** (`/recap`). CA, quantités vendues, marge estimée - recalculés
  à chaque demande, exportés en CSV avec le catalogue.
- **La vitre** (`/accueil`). CA du jour, tickets du jour, ruptures et seuils
  d'alerte qui remontent avant que le client ne demande.

## Ce qui est vérifié

- `pytest` backend : 10 tests, dont le stock qui descend à la vente, le
  stock qui remonte à l'annulation, le refus de stock insuffisant, le rôle
  caissier qui ne touche pas aux prix.
- `npm run lint`, `tsc --noEmit`, `next build` : verts.
- Parcours HTTP réel : connexion, les six écrans, `/etat` (41 articles,
  CA total de démonstration), `/recap` (37 tickets, marge calculée).

## Ce qui reste à vérifier

- **Les clics réels au pouce** : le panier de caisse est un composant client
  vérifié en logique et en HTTP, pas encore à la main sur un téléphone.
- **Le rendu à 375/390 px.**
- **L'impression du ticket** n'est pas prévue : la vente se relit à
  l'écran, l'export CSV fait foi pour le comptable.

## Les décisions de fabrication

- Le prix unitaire **se fige à la vente**, pas à l'article : changer le prix
  de vente demain ne réécrit pas le ticket d'aujourd'hui.
- Le stock bouge à la vente validée, à l'annulation et au réassort - jamais
  à l'édition d'un prix ou d'un nom.
- Le backend rend des nombres, des dates ISO et des clés stables, jamais de
  phrase : les refus portent `{code, fr, en}`, y compris les 422 de Pydantic.
