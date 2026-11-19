# evo-agent - l'agent IA autonome

La file des tâches, les exécutions journalisées, le mois recalculé - le tout
en local : en mode démo, **aucun SMS, aucun appel, aucune tâche ne quitte la
machine**.

## Ce que le produit fait

- **La file** (`/taches`) : chaque tâche avec titre, consigne, type
  (recherche, rédaction, résumé, analyse, automatisation, autre) et priorité
  (basse, normale, haute). La file se trie priorité d'abord.
- **L'exécution** : un geste lance l'agent - exécution datée, mesurée en
  secondes, résultat déterministe rédigé localement. Le journal garde chaque
  passage.
- **La clôture** : une tâche en cours se clôt par un résultat (ou une erreur)
  écrit à la main - la trace humaine reste.
- **Le journal** (`/executions`) : chaque exécution avec la tâche, le début,
  la fin, la durée, le résultat.
- **Le mois** (`/recap`) : tâches confiées, terminées, par type et par statut,
  temps d'exécution total - recalculé à la demande, exports CSV.
- **Réglages** : organisation, comptes (responsable / agent), exports.

## Comptes de démonstration

| Rôle         | Adresse              | Mot de passe |
|--------------|----------------------|--------------|
| Responsable  | `ada@agence.cm`      | `Agent2026!`  |
| Agent        | `mbarga@agence.cm`   | `Agent2026!`  |

## Lancer

Backend (port 10600) :

```bash
cd backend
python -m uvicorn app.main:app --port 10600
```

Frontend (port 5600) :

```bash
cd frontend
npm install
npm run dev   # ou npm run build && npm run start
```

Variables utiles : `EVO_AGENT_DATABASE_URL`, `EVO_AGENT_DEMO_MODE`,
`EVO_AGENT_SEED_DEMO`, `EVO_AGENT_JWT_SECRET`, `EVO_AGENT_API_URL`,
`EVO_AGENT_SITE_URL`.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 9 tests
cd frontend && npm run lint && npm run build
```
