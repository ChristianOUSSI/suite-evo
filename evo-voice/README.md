# evo-voice - dictée & commande vocale

Ce qui a été dit, ce que ça veut dire, ce qui s'est passé - tout en local :
en mode démo, **aucun SMS, aucun appel, aucune commande ne quitte la
machine**.

## Ce que le produit fait

- **La dictée** (`/commandes`) : la phrase dite est recopiée telle quelle
  (en démo, on la tape - le micro dort). L'intention est devinée par des
  règles simples : rappel, message, note, recherche, alerte, autre.
- **L'interprétation** : chaque commande arrive déjà lue - l'écran dit ce
  que la règle a compris, et l'humain peut corriger l'intention à la main.
- **L'exécution** : un geste exécute la commande ici - résultat
  déterministe, horodaté, journalisé. Rien n'est envoyé : ni SMS, ni appel,
  ni message.
- **Le mois** (`/recap`) : dictées reçues, exécutées, par intention et par
  statut - recalculé à la demande, export CSV.
- **Réglages** : organisation, comptes (responsable / agent), exports.

## Comptes de démonstration

| Rôle         | Adresse              | Mot de passe |
|--------------|----------------------|--------------|
| Responsable  | `ada@bureau.cm`      | `Voice2026!`  |
| Agent        | `mbarga@bureau.cm`   | `Voice2026!`  |

## Lancer

Backend (port 10700) :

```bash
cd backend
python -m uvicorn app.main:app --port 10700
```

Frontend (port 5700) :

```bash
cd frontend
npm install
npm run dev   # ou npm run build && npm run start
```

Variables utiles : `EVO_VOICE_DATABASE_URL`, `EVO_VOICE_DEMO_MODE`,
`EVO_VOICE_SEED_DEMO`, `EVO_VOICE_JWT_SECRET`, `EVO_VOICE_API_URL`,
`EVO_VOICE_SITE_URL`.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 9 tests
cd frontend && npm run lint && npm run build
```
