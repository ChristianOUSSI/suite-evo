# evo-gaz — Distribution de GPL

Le dépôt de GPL d'un camerounais : les livraisons de bonbonnes, les clients
(particuliers, revendeurs, restaurants, chantiers), et une page publique où
le client commande sans compte.

## Ce que le produit fait

- **Les livraisons** (`/livraisons`) : une fiche par bonbonne partie — client,
  quartier, quantité, prix unitaire, statut. Le cycle avance d'un geste :
  `commandee → en_route → livree`, ou `annulee`. La date de livraison se note
  toute seule à la livraison ; revenir en arrière l'efface.
- **Les clients** (`/clients`) : nom, numéro camerounais (opérateur reconnu),
  quartier, type — le carnet ne perd personne.
- **La page publique `/commander`** : le client tape nom, numéro, quartier et
  quantité — sans compte. Le client est retrouvé par son numéro ou créé ; le
  dépôt voit la commande immédiatement. À envoyer sur WhatsApp.
- **Le mois** (`/recap`) : livraisons livrées, bonbonnes, montant, par
  quartier et par type de client — recalculé à la demande, exports CSV.
- Comptes démo : `ada@depotgaz.cm` / `mbarga@depotgaz.cm`, mot de passe
  `Gaz2026!`.

## Technique

- Backend FastAPI + SQLite, JWT en cookie HTTP-only, rôles `responsable`/`agent`.
- Frontend Next.js (App Router) sur le socle `@cadc/kit`, français + anglais.
- Ports : API `127.0.0.1:10400`, front `localhost:5400`.
- Préfixe d'environnement : `EVO_GAZ_` (cookie `evo_gaz_session`).

## Vérification

```bash
cd backend && python -m pytest -q        # 10 tests
cd frontend && npm run lint && npm run build
```

## Licence / marque

CODE AXIS DIGITAL CAMEROON — produit de la famille evo.
