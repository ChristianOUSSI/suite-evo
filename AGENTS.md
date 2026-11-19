# suite-evo - conventions de la maison

Vingt-deux produits `evo-*` + le `portail/` + le socle `cadc/kit`.
Chaque produit est autonome : `backend/` (FastAPI + SQLite) et
`frontend/` (Next.js 16 + React 19 + `@cadc/kit`).

## Règles qui ne bougent pas

- **Français d'abord, anglais ensuite** : toute chaîne visible passe par
  le dictionnaire (`src/lib/langue.ts`) ou par les messages backend
  `{code, fr, en}`.
- **Cameroon d'abord** : FCFA/XAF, numéros `+237`, villes et quartiers,
  Mobile Money quand c'est de l'argent.
- **Mobile d'abord** : une main, un pouce, gros caractères, cibles
  tactiles larges. Le public va du jeune au très âgé.
- **Démo locale** : aucun SMS, appel ou argent ne quitte la machine.
  Le health le dit : `"aucun SMS, aucun appel, aucune … ne quitte cette
  machine"`.
- **Ports** : la table fait foi (voir README.md). Ne jamais réutiliser
  un port pris - evo-clinic a sauté 4100/9100 pour ça.
- **Kit** : avant lint/build, `node ../../cadc/kit/sync.mjs`. Ne jamais
  copier le socle dans un produit.
- **Pas de secret en clair** : `.env` est ignoré, `.env.example` reste.

## Vérification avant commit

```bash
cd <produit>/backend && python -m pytest tests -q
cd <produit>/frontend && npm run lint && npx tsc --noEmit && npm run build
```

Python : `/c/Users/Christian/tools/py312/python.exe` sur cette machine.
Node : `/c/Users/Christian/tools/node-v24.22.2-win-x64` dans le PATH.

## Lancer la suite

```bash
scripts/lancer.sh    # les 22 backends + fronts + portail
scripts/arreter.sh   # tout arrêter
```

Le portail (`portail/frontend`, port 5800) liste les produits et sonde
leur disponibilité - ajouter un produit = ajouter une ligne dans
`src/lib/produits.ts`.
