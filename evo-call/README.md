# evo-call — le centre d'appels

Le standard d'une maison camerounaise : la file d'appels, les agents,
les durées, les rappels — sans poste qui se perd et sans appel oublié.

## Ce que le produit fait

- **Les appels** (`/appels`) : chaque appel avec son client, son numéro
  camerounais (normalisé `+237`, opérateur MTN/Orange/Nexttel détecté),
  son sens (entrant/sortant), son motif (vente, SAV, renseignement,
  plainte, rappel, prospection, autre), sa durée en secondes lisible en
  minutes, sa date — jamais dans le futur.
- **Le cycle de vie** : `en_file` → `en_cours` → `termine`, ou
  `sans_reponse`, `rappel` (avec sa date), `annule`. Le statut se change
  d'un geste ; le passé ne se réécrit pas.
- **Les agents** : un appel en file ou en cours peut être assigné à un
  agent du centre.
- **Les rappels** (`/rappels`) : les appels promis reviennent à leur
  date — un rappel n'est pas un appel perdu.
- **`/file` public** : la page où l'appelant voit combien de personnes
  attendent, sans compte — aucun nom, aucun numéro ne sort d'ici.
- **Le mois** (`/recap`) : appels, durées totales et moyennes, par agent,
  par motif, par statut — recalculé à la demande, export CSV.
- Comptes démo : `ada@call.cm` / `mbarga@call.cm`, mot de passe
  `Call2026!`. Tout en **français + anglais**, palette et polices CADC,
  mobile-first.

## Démo

Aucun appel réel n'est passé : les durées et statuts sont saisis à la
main. Le mode démo le dit clairement.

## Lancer

```bash
# Backend (API sur 9700)
cd backend
python -m uvicorn app.main:app --port 9700

# Frontend (sur 4700)
cd frontend
npm install
npm run dev
```

## Vérifications

- `cd backend && python -m pytest tests -q` — 13 tests.
- `cd frontend && npm run lint && npx tsc --noEmit && npm run build`.
