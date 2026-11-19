# evo-auto - la vente automobile

Le parc d'un concessionnaire camerounais : les véhicules, les clients,
les ventes - et un catalogue public que l'acheteur lit sans compte.

## Ce que le produit fait

- **Les véhicules** (`/vehicules`) : chaque voiture avec sa marque, son
  modèle, son année, son kilométrage, son carburant (essence, diesel,
  hybride, électrique), sa boîte (manuelle, automatique), son prix en
  FCFA. Le statut se change d'un geste : `en_vente` → `reserve` →
  `vendu` / `retire`.
- **La vente** : passer un véhicule à `vendu` exige un client du carnet
  et porte la date du jour - la vente est une date, pas un commentaire.
  Repasser en vente efface client et date sans effacer la trace.
- **Les clients** (`/clients`) : chaque acheteur ou prospect avec son
  numéro camerounais (normalisé `+237`, opérateur détecté) et son type
  (particulier, entreprise, garage).
- **`/catalogue` public** : les véhicules en vente, rien d'autre - ni
  client, ni réservé, ni vendu. À envoyer sur WhatsApp.
- **Le mois** (`/recap`) : ventes du mois, valeur du stock, valeur vendue,
  par marque, par carburant, par statut - recalculé à la demande,
  exports CSV (véhicules + clients).
- Comptes démo : `ada@auto.cm` / `mbarga@auto.cm`, mot de passe
  `Auto2026!`. Tout en **français + anglais**, palette et polices CADC,
  mobile-first.

## Démo

Aucune vente réelle n'est conclue : les prix et statuts sont saisis à la
main. Le mode démo le dit clairement.

## Lancer

```bash
# Backend (API sur 9800)
cd backend
python -m uvicorn app.main:app --port 9800

# Frontend (sur 4800)
cd frontend
npm install
npm run dev
```

## Vérifications

- `cd backend && python -m pytest tests -q` - 12 tests.
- `cd frontend && npm run lint && npx tsc --noEmit && npm run build`.
