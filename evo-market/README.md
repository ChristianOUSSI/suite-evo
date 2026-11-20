# evo-market - Marketplace

La marketplace d'une boutique camerounaise : annonces de vente, stock, commandes, page publique des articles - sans cahier papier ni vente oubliée. Code Axis Digital Cameroon.

## Ce que le produit fait

- **Les annonces** (`/annonces`) : chaque article avec son titre, sa catégorie (alimentation, vêtements, électronique, maison, beauté, téléphone, auto, autre), son prix en FCFA, son stock, sa ville et son quartier, son vendeur et son numéro camerounais. Le statut se change d'un geste : en ligne → vendu / retiré. Une annonce retirée sort de la page publique sans s'effacer.
- **Les commandes** (`/commandes`) : chaque vente avec l'annonce, la quantité, l'acheteur, son numéro, le moyen de paiement (espèces, MTN/Orange/Nexttel Money, virement) et le statut : nouvelle → confirmée → livrée / annulée. Le montant est figé au moment de la vente ; le stock descend quand la commande est confirmée et lui est rendu si on en sort. Une annonce épuisée ou retirée ne se commande plus (refus `rupture`).
- **L'accueil** (`/accueil`) : la vitre du comptoir - annonces en ligne, ruptures, commandes neuves, ventes du mois et total vendu.
- **La page publique** (`/catalogue`) : les articles en ligne, les prix, les quartiers - **sans compte**, à envoyer sur WhatsApp. Elle ne montre ni vendeurs ni commandes.
- **La commande en ligne** (`/commander`) : l'acheteur choisit l'article, la quantité, son nom et son numéro, sans compte. La demande arrive « demandée » ; la boutique confirme ou annule dans `/demandes`, puis crée la commande en caisse.
- **Le mois** (`/recap`) : ventes, commandes, par statut et par catégorie - recalculé à la demande, exports CSV (`/api/exports/annonces.csv`, `/api/exports/commandes.csv`).
- **Les réglages** (`/reglages`) : la boutique (nom, ville, quartier, téléphone), les comptes, les exports.

## Rôles

- **Responsable** : tout, plus les comptes et les réglages.
- **Agent** : les annonces et les commandes - le quotidien du comptoir.

## Compte de démonstration

| Rôle | Adresse | Mot de passe |
|---|---|---|
| Responsable | `ada@market.cm` | `Market2026!` |
| Agent | `mbarga@market.cm` | `Market2026!` |

## Lancer

```bash
# Backend - API sur http://127.0.0.1:9500
cd backend
python -m uvicorn app.main:app --port 9500

# Frontend - http://localhost:4500
cd frontend
npm install
npm run dev
```

Variables d'environnement backend : préfixe `EVO_MARKET_` (voir `backend/.env.example`). La base SQLite `evo_market.db` et le seed démo (`EVO_MARKET_SEED_DEMO=true`) se règlent là.

## Vérifications

- `pytest` dans `backend/` : 9 tests (seed, annonces, commandes, stock, page publique, récap, exports, droits).
- `npm run lint` et `npm run build` dans `frontend/` : verts.

## Français + anglais

Toute l'interface est bilingue (français par défaut, anglais à un geste). Les refus de l'API reviennent en `{code, fr, en}` et l'écran choisit la langue. Montants en FCFA, numéros camerounais normalisés en `+237`, opérateurs MTN/Orange/Nexttel reconnus.
