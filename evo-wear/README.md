# evo-wear - Prêt-à-porter

La boutique d'un prêt-à-porter camerounais : chaque article avec sa
taille, sa couleur, son stock et son prix - et un catalogue public où
la cliente lit les articles en stock sans compte.

## Ce que le produit fait

- **Les articles** (`/articles`) : nom, catégorie (pagne, robe,
  chemise, pantalon, ensemble, chaussure, accessoire), taille, couleur,
  stock, prix d'achat et de vente. Le statut se change d'un geste :
  en stock → vendu → épuisé - la vente descend le stock, porte sa
  cliente et sa date (une vente plus grande que le stock est refusée).
- **Les clientes** (`/clients`) : particulières, revendeurs, événements
  - avec leur numéro camerounais (MTN, Orange, Nexttel).
- **Le mois** (`/recap`) : articles vendus, quantité, encaissé,
  valeur du stock, par catégorie, statut et couleur - exports CSV.
- **`/catalogue` public** : les articles en stock, leurs prix - sans
  compte, sans prix d'achat. À envoyer sur WhatsApp.
- Tout en **français + anglais**, palette et polices CADC, mobile-first.

## Lancer

```bash
# API (depuis backend/)
EVO_WEAR_SEED_DEMO=true EVO_WEAR_DEMO_MODE=true \
  python -m uvicorn app.main:app --port 10300

# Frontend (depuis frontend/)
npm install
EVO_WEAR_API_URL=http://127.0.0.1:10300 npm run dev -- --port 5300
```

Comptes de démonstration : `ada@boutique.cm` / `Wear2026!` (responsable),
`mbarga@boutique.cm` / `Wear2026!` (agent).

En mode démo, aucun SMS, aucun appel, aucun message ne quitte la machine.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 6 tests
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
