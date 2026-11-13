# PALABRE · le carnet de comptes

PALABRE tient la liste des créances d'une quincaillerie de Douala et relance les
clients qui traînent à payer. Le commerçant note ses factures ouvertes, fixe une
date, et PALABRE envoie les rappels à sa place, par SMS, WhatsApp ou message
vocal. Le client, lui, reçoit un lien, voit ce qu'il reste à régler, et paie par
Mobile Money sans créer de compte.

Le produit est livré en édition de démonstration : un jeu de données inventé, des
paiements simulés, des messages qui ne quittent pas la machine. Tout ce qui
touche de l'argent ou un opérateur est bouché volontairement, et le carnet
l'affiche à l'écran.

## Ce que fait le carnet

- Saisie d'une créance à la main ou import d'un fichier CSV, avec contrôle des
  doublons avant l'entrée au registre.
- Classement automatique : à échoir, en retard, partielle, promesse, réglée,
  litige.
- Séquence de relance sur cinq paliers (J-3, J, J+3, J+7, J+14), avec deux tons
  au choix, courtois ou ferme, et un canal de repli si un canal est coupé.
- Promesse de paiement notée, tenue ou manquée.
- Encaissements enregistrés au comptoir ou réglés en ligne par le client, avec
  reçu.
- Lien public par facture, valable tant que la facture existe, avec son propre
  jeton.
- Point du soir : ce qui est rentré, ce qui a été relancé, ce qui reste ouvert.

## Lancer le projet

Deux services, dans deux terminaux. Depuis la racine du dossier `palabre`.

**1. L'API Python**, sur `http://127.0.0.1:8000` :

```bash
cd backend
python -m venv .venv && . .venv/bin/activate   # ou .venv\Scripts\activate sous Windows
pip install -r requirements.txt
cp .env.example .env                            # puis changer PALABRE_JWT_SECRET
uvicorn app.main:app --reload
```

La base SQLite se crée et se remplit du jeu de démonstration au premier
démarrage. Voir `backend/README.md`.

**2. Le site Next.js**, sur `http://localhost:3000` :

```bash
cd frontend
npm install
npm run dev
```

Le frontend renvoie `/api/*` vers l'API. L'adresse de l'API se change avec la
variable `PALABRE_API_URL`. Voir `frontend/README.md`.

**Compte de démonstration** : `patron@nanafils.cm` / `Palabre2026!`
(Alphonse Nana, Quincaillerie Nana & Fils, Mboppi).

## Comment tout cela est coupé

- Un paiement en ligne écrit un reçu et met à jour le solde. Aucun opérateur
  Mobile Money n'est appelé, aucun compte n'est débité.
- Une relance passe à l'état « envoyée » avec une référence `DEMO-xxxxx`. Rien
  ne part chez un agrégateur de SMS.
- Les jetons d'accès, les références de facture et les montants du jeu de
  démonstration sont fictifs.

Pour repartir d'un carnet vierge ou recharger la démo :

```bash
cd backend
python -m app.services.seed --reset
```

## Architecture

```
palabre/
  backend/    FastAPI + SQLAlchemy 2 + SQLite   (api, règles de relance, portail client)
  frontend/   Next.js 16 App Router + CSS propre (présentation, carnet, réglages)
```

Le frontend ne parle qu'à l'API. La séquence de relance, le calcul du reste à
régler, les étiquettes de statut et les mentions des messages vivent dans
`backend/app/services/` ; le site les affiche telles quelles. Le portail client
(`/payer/<jeton>`) est rendu par le frontend et nourri par
`/public/invoices/<jeton>`.

## Vérifications

```bash
cd backend && pytest -q        # 13 tests : session, créances, import, relances, paiement public
cd frontend && npm run lint && npm run build
```
