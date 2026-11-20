# evo-school

La caisse de l'école. Frais scolaires, versements, reçus qui se vérifient -
un téléphone au bureau, pas un cahier qui se perd.

Backend FastAPI + SQLite, frontend Next.js 16 / React 19 / TypeScript strict.
Le produit est bilingue français et anglais et pose sur le socle `@cadc/kit`
(palette CADC, règles du Cameroun, deux langues).

## Démarrer

```bash
cd backend && python -m uvicorn app.main:app --port 9000
cd frontend && npm install && npm run dev   # http://localhost:4000
```

`npm run dev`, `npm run build` et `npm run lint` exécutent d'abord
`node ../../cadc/kit/sync.mjs`. Cette copie est obligatoire : Turbopack ne
suit pas le lien `node_modules/@cadc/kit` sous Windows.

Comptes de démonstration : `ada@ecolecm.cm` (responsable) et
`mbarga@ecolecm.cm` (comptable), mot de passe `School2026!`.

## Ce que fait la caisse

- **La caisse** (`/caisse`). Choisir l'élève, taper le montant, choisir le
  moyen (espèces, MTN Money, Orange Money…), c'est fini. Un code de reçu de
  dix signes se génère tout seul - le parent peut le vérifier sans compte
  sur `/verifier`.
- **Les élèves** (`/eleves`). Une fiche par enfant : classe, matricule,
  parent et son numéro camerounais, frais attendus. Payé, reste et solde se
  calculent seuls. Filtre « ceux qui restent à payer ».
- **Les classes** (`/classes`). Titulaire, frais annuels. Le responsable
  seul y touche - une classe mal nommée est une caisse qui ne rentre pas.
- **Le mois** (`/recap`). Encaissé, reste à percevoir, par classe et par
  élève - recalculés à chaque demande, exports CSV.
- **La vitre** (`/accueil`). Le CA du mois, les élèves, les classes, le
  reste total.
- **L'inscription en ligne** (`/inscription`). Le parent écrit le nom de
  son enfant, son numéro et la classe voulue, sans compte. La demande
  arrive « demandée » ; l'école l'inscrit ou la refuse dans
  `/inscriptions`, puis crée la fiche élève.

## Ce qui est vérifié

- `pytest` backend : 11 tests, dont le reçu généré à l'encaissement, le
  refus d'une date future, l'annulation qui exclut le versement du solde,
  le rôle comptable qui ne touche pas aux classes.
- `npm run lint`, `tsc --noEmit`, `next build` : verts (12 routes).
- Parcours HTTP réel : connexion, les sept écrans en 200, `/etat` (145
  élèves, 8 classes, 300 000 FCFA encaissés en novembre), `/recap`, le
  reçu public `D33VYKF54D` qui rend la fiche de Fiston Grâce, l'export CSV.

## Ce qui reste à vérifier

- **Les clics réels au pouce** : les écrans sont vérifiés en logique et en
  HTTP, pas encore à la main sur un téléphone.
- **Le rendu à 375/390 px.**
- **L'impression du reçu** n'est pas prévue : le code `/verifier` fait foi.

## Les décisions de fabrication

- Le reçu est un **code à dix signes**, pas un numéro : le parent peut le
  dicter au téléphone sans compte, et un code erroné ne donne rien.
- Un versement **annulé garde sa trace** mais sort des totaux : on ne
  réécrit pas le passé, on corrige devant.
- Une date future est refusée : la caisse n'avance pas le temps.
- Les frais attendus vivent sur la fiche élève, pas sur la classe : deux
  enfants de la même classe peuvent avoir des bourses différentes.
