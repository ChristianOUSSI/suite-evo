# evo-hotel

Le cahier des chambres. Un téléphone à la réception : qui dort où ce soir,
qui arrive demain, ce que le mois a rapporté — et la feuille que le
comptable demande, sans papier et sans double réservation.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Le produit est bilingue français et anglais et pose sur le socle `@cadc/kit`
(palette CADC reprise des logos, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 8800
cd frontend && npm install && npm run dev   # http://localhost:3800
```

`npm run dev`, `npm run build` et `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs`. Cette copie est obligatoire : Turbopack ne
suit pas le lien `node_modules/@cadc/kit` sous Windows.

Comptes de démonstration : `ada@hotellba.cm` (responsable) et
`mbarga@hotellba.cm` (réceptionniste), mot de passe `Hotel2026!`.

## Ce que fait le cahier

- **La réception.** La vitre du soir : chambres occupées, libres, arrivées
  et départs du jour, séjours à venir.
- **Les séjours.** Une réservation = une chambre, un client, des dates. Une
  chambre ne se loue pas deux fois au même soir : la vérification se fait à
  l'écriture, un séjour qui se touche sans se chevaucher reste légal. Le
  client connu revient par son numéro, sa fiche est déjà là.
- **Les gestes.** Confirmé → en cours → terminé, ou annulé : la chambre se
  libère en un geste. Un séjour clos ne se rouvre pas.
- **Les chambres et les clients.** Fiches séparées, le responsable seul
  touche aux chambres et aux comptes ; la réception gère les séjours.
- **Le mois.** Nuits vendues, recette estimée (nuits × prix de la nuit),
  taux d'occupation — recalculés à chaque demande. Quatre exports CSV.

## Ce qui est vérifié

- `pytest` backend : 15 tests, dont le refus de chevauchement, le client
  connu par numéro, le cycle de vie du séjour et les rôles.
- `npm run lint`, `tsc --noEmit`, `next build` : verts.
- Parcours HTTP réel : connexion, les sept écrans, `/etat`, `/recap`,
  `/disponibilite` avec des données de démonstration garnies.

## Ce qui reste à vérifier

- **Les clics réels au pouce** : le formulaire de réservation et les gestes
  de statut sont des composants client vérifiés en logique et en HTTP.
- **Le rendu à 375/390 px.**

## Les décisions de fabrication

- Le statut se décide à l'écriture ; « en cours » et « à venir » se déduisent
  des dates à la lecture — personne ne met à jour un champ statut.
- Le montant se calcule à la lecture : nuits × prix de la nuit au tarif du
  jour. Un prix corrigé change le devis, pas le passé.
- Le backend rend des nombres, des dates ISO et des clés stables, jamais de
  phrase : les refus portent `{code, fr, en}`, y compris les 422 de Pydantic.
