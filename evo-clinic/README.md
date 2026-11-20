# evo-clinic

Le registre de la clinique de quartier. Patients, actes, encaissements,
reçu vérifiable - un téléphone à l'accueil, pas un cahier qui se perd.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Le produit est bilingue français et anglais et pose sur le socle `@cadc/kit`
(palette CADC, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 9200
cd frontend && npm install && npm run dev   # http://localhost:4200
```

`npm run dev`, `npm run build` et `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs`. Cette copie est obligatoire : Turbopack ne
suit pas le lien `node_modules/@cadc/kit` sous Windows.

Comptes de démonstration : `ada@clinique.cm` (responsable) et
`mbarga@clinique.cm` (agent), mot de passe `Clinic2026!`.

## Ce que fait le registre

- **L'accueil** (`/accueil`). La vitre du jour : encaissé ce mois, reste à
  encaisser, patients, actes du mois.
- **Les actes** (`/actes`). Une consultation par ligne : patient, motif,
  diagnostic, traitement, prix figé. L'agent consigne, le responsable seul
  annule - et l'annulation garde la trace.
- **Les patients** (`/patients`, `/patients/[id]`). Une fiche par personne :
  groupe sanguin, sexe, naissance, allergies, note. Le détail réunit les
  actes et les paiements du patient. Filtre « ceux qui doivent ».
- **Les paiements** (`/caisse`). Espèces, MTN Money, Orange Money, Nexttel,
  virement, assurance : chaque encaissement sort son reçu de dix signes.
- **Le mois** (`/recap`). Actes par motif, encaissé, reste dû - recalculé à
  la demande, exports CSV.
- **`/verifier` public**. Le patient vérifie son reçu avec le code, sans
  compte.
- **Le rendez-vous en ligne** (`/rdv`). Le patient écrit nom, numéro,
  motif, jour et heure, sans compte. La demande arrive « demandée » ; la
  clinique confirme, refuse ou marque fait dans `/rendez-vous`, puis
  consigne la consultation comme un acte ordinaire.

## Ce qui est vérifié

- `pytest` backend : 11 tests, dont le prix de l'acte figé, le reçu public
  sans session, l'annulation qui exclut le paiement du reste dû, le refus
  d'une date future, le rôle agent qui consigne mais n'annule pas.
- `npm run lint`, `tsc --noEmit`, `next build` : verts (13 routes).
- Parcours HTTP réel : connexion, les huit écrans en 200, `/etat` (62
  patients, 11 actes et 120 000 FCFA en novembre), `/recap`, le reçu public
  `X2FRAPZ2C6` qui rend la fiche de Grâce Grâce, l'export CSV.

## Ce qui reste à vérifier

- **Les clics réels au pouce** : les écrans sont vérifiés en logique et en
  HTTP, pas encore à la main sur un téléphone.
- **Le rendu à 375/390 px.**
- **L'impression du reçu** n'est pas prévue : le code `/verifier` fait foi.
- **Les ordonnances et la pharmacie** ne sont pas dans ce produit : le
  registre note le traitement, il ne délivre pas.

## Les décisions de fabrication

- Le prix de l'acte **se fige à l'écriture** : changer la grille demain ne
  réécrit pas la consultation d'hier.
- Le reste dû du patient = actes non annulés − paiements non annulés,
  **recalculé à la lecture** : aucune colonne de solde à désynchroniser.
- Un reçu est un **code à dix signes** dérivé d'un secret serveur : le
  patient peut le dicter au téléphone sans compte, et un code erroné ne
  donne rien.
- Annuler un acte ou un paiement **garde la ligne** : on corrige devant,
  on ne réécrit pas le passé.
