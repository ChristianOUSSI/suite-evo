# evo-moto - Motos & atelier

L'atelier d'un garage camerounais : chaque moto avec sa fiche et son
prix, chaque réparation avec sa panne et son coût - et un catalogue
public où le client lit les motos en vente sans compte.

## Ce que le produit fait

- **Les motos** (`/motos`) : marque, modèle, année, kilométrage,
  couleur, prix. Le statut se change d'un geste : en vente → réservé →
  vendu → retiré - la vente porte son client et sa date.
- **Les réparations** (`/reparations`) : le client, la panne, les
  travaux, la main-d'œuvre, les pièces, l'immatriculation. Le statut
  avance : reçue → en cours → terminée → livrée - chaque passage porte
  sa date.
- **Les clients** (`/clients`) : acheteurs, propriétaires, livreurs -
  avec leur numéro camerounais (MTN, Orange, Nexttel).
- **Le mois** (`/recap`) : motos vendues, valeur vendue, encaissé
  atelier, réparations par statut, par marque - exports CSV.
- **`/catalogue` public** : les motos en vente, leurs prix - sans
  compte. À envoyer sur WhatsApp.
- **`/demande` public** : le client écrit pour une moto ou une
  réparation, sans compte. La demande arrive « demandée » ; le garage
  confirme ou annule dans `/demandes`, puis vend ou répare.
- Tout en **français + anglais**, palette et polices CADC, mobile-first.

## Lancer

```bash
# API (depuis backend/)
EVO_MOTO_SEED_DEMO=true EVO_MOTO_DEMO_MODE=true \
  python -m uvicorn app.main:app --port 10100

# Frontend (depuis frontend/)
npm install
EVO_MOTO_API_URL=http://127.0.0.1:10100 npm run dev -- --port 5100
```

Comptes de démonstration : `ada@moto.cm` / `Moto2026!` (responsable),
`mbarga@moto.cm` / `Moto2026!` (agent).

En mode démo, aucun SMS, aucun appel, aucun message ne quitte la machine.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 12 tests
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
