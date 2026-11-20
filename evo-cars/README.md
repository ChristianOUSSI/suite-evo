# evo-cars - Voitures & pièces

Le garage d'un concessionnaire camerounais : chaque voiture du parc
avec sa fiche et son prix, chaque pièce détachée avec son stock - et
un catalogue public où le client lit les voitures et les pièces sans
compte.

## Ce que le produit fait

- **Les voitures** (`/voitures`) : marque, modèle, année, kilométrage,
  carburant, boîte, prix. Le statut se change d'un geste : en vente →
  réservé → vendu → retiré - la vente porte son client et sa date.
- **Les pièces** (`/pieces`) : référence, désignation, compatibilité,
  stock, prix d'achat et de vente. Vendre descend le stock (une vente
  plus grande que le stock est refusée), le réassort le remonte, la
  vente porte son client et sa date.
- **Les clients** (`/clients`) : acheteurs et garages partenaires -
  avec leur numéro camerounais (MTN, Orange, Nexttel).
- **Le mois** (`/recap`) : voitures vendues, encaissé pièces,
  valeur du stock, par marque et par statut - exports CSV.
- **`/catalogue` public** : voitures en vente et pièces en stock,
  leurs prix - sans compte. À envoyer sur WhatsApp.
- **`/demande` public** : le client écrit pour une voiture ou une
  pièce, sans compte. La demande arrive « demandée » ; le garage
  confirme ou annule dans `/demandes`, puis vend.
- Tout en **français + anglais**, palette et polices CADC, mobile-first.

## Lancer

```bash
# API (depuis backend/)
EVO_CARS_SEED_DEMO=true EVO_CARS_DEMO_MODE=true \
  python -m uvicorn app.main:app --port 10200

# Frontend (depuis frontend/)
npm install
EVO_CARS_API_URL=http://127.0.0.1:10200 npm run dev -- --port 5200
```

Comptes de démonstration : `ada@garage.cm` / `Cars2026!` (responsable),
`mbarga@garage.cm` / `Cars2026!` (agent).

En mode démo, aucun SMS, aucun appel, aucun message ne quitte la machine.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 7 tests
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
