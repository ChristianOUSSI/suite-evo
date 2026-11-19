# evo-carnet - Carnet numérique

Le carnet numérique d'une famille ou d'une petite organisation camerounaise :
les notes, leurs catégories, leurs épingles - et un lien public pour
partager une note sur WhatsApp.

## Ce que le produit fait

- **Les notes** (`/notes`) : titre, contenu, catégorie (personnel, travail,
  courses, idées, santé, argent, autre). Épingler fait remonter la note,
  archiver la range au fond - rien ne se perd.
- **Le partage** : chaque note a un code (`/partage/CODE`) qui ouvre une page
  publique en lecture seule, sans compte. « Nouveau code » remplace l'ancien
  lien - l'ancien meurt.
- **La recherche** : titre, contenu et catégorie, avec filtre par catégorie
  et bascule notes/archivées.
- **Le mois** (`/recap`) : notes écrites, mots, par catégorie - recalculé à
  la demande, export CSV.
- Comptes démo : `ada@carnet.cm` / `mbarga@carnet.cm`, mot de passe
  `Carnet2026!`.

## Technique

- Backend FastAPI + SQLite, JWT en cookie HTTP-only, rôles `responsable`/`agent`.
- Frontend Next.js (App Router) sur le socle `@cadc/kit`, français + anglais.
- Ports : API `127.0.0.1:10500`, front `localhost:5500`.
- Préfixe d'environnement : `EVO_CARNET_` (cookie `evo_carnet_session`).

## Vérification

```bash
cd backend && python -m pytest -q        # 9 tests
cd frontend && npm run lint && npm run build
```

## Licence / marque

CODE AXIS DIGITAL CAMEROON - produit de la famille evo.
