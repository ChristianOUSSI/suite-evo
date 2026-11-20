# evo-bijou - Bijouterie

La vitrine d'une bijouterie camerounaise : chaque pièce avec sa
référence, sa matière, son poids en grammes, son carat, ses prix - et
un catalogue public où le client lit les pièces en vitrine sans compte.

## Ce que le produit fait

- **Les pièces** (`/pieces`) : nom, matière (or, argent, plaqué or,
  acier, perles, autre), poids, carat, prix d'achat et de vente,
  fournisseur, note. La référence `BJ-XXXXXX` se génère toute seule.
  Le statut se change d'un geste : en vitrine → réservé → vendu →
  retiré - la vente porte son client et sa date, rien ne s'efface.
- **Les clients** (`/clients`) : chaque acheteur ou collectionneur avec
  son numéro camerounais (MTN, Orange, Nexttel) et son type.
- **Le mois** (`/recap`) : pièces vendues, valeur vendue, marge,
  valeur en vitrine, par matière et par statut - recalculé à la
  demande, exports CSV.
- **`/catalogue` public** : les pièces en vitrine, leurs prix - sans
  compte, sans prix d'achat. À envoyer sur WhatsApp.
- **`/demande` public** : le client demande une pièce depuis le
  catalogue, sans compte. La demande arrive « demandée » ; la
  bijouterie confirme ou annule dans `/demandes`, puis vend ou
  réserve la pièce.
- Tout en **français + anglais**, palette et polices CADC, mobile-first.

## Lancer

```bash
# API (depuis backend/)
EVO_BIJO_SEED_DEMO=true EVO_BIJO_DEMO_MODE=true \
  python -m uvicorn app.main:app --port 10000

# Frontend (depuis frontend/)
npm install
EVO_BIJO_API_URL=http://127.0.0.1:10000 npm run dev -- --port 5000
```

Comptes de démonstration : `ada@bijou.cm` / `Bijou2026!` (responsable),
`mbarga@bijou.cm` / `Bijou2026!` (agent).

En mode démo, aucun SMS, aucun appel, aucun message ne quitte la machine.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 11 tests
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
