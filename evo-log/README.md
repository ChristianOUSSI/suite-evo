# evo-log — Logistique & colis

Le registre d'un transporteur camerounais : chaque colis avec son numéro de
suivi à dix signes, chaque statut qui avance (reçu → en transit → arrivé →
distribué), et une page publique `/suivi` que le destinataire ouvre sans
compte.

## Ce que le produit fait

- **Les colis** (`/colis`) : une fiche par envoi — genre (document, colis,
  valise, électroménager, palette), expéditeur et destinataire avec leurs
  numéros camerounais, trajet entre villes desservies, poids, frais en FCFA
  et moyen de paiement (espèces, MTN/Orange/Nexttel Money, virement, à payer).
- **Le numéro de suivi** : généré automatiquement, dix signes sans I, O, 0
  ni 1 — dicible au téléphone, unique par transporteur.
- **Le statut** : reçu → en transit → arrivé → distribué, plus retourné et
  annulé pour la vie réelle. Passer à « distribué » pose la date de
  livraison toute seule ; revenir en arrière l'efface.
- **`/suivi` public** : le destinataire tape son numéro — statut, trajet,
  dates, téléphone du transporteur — sans compte. Ne montre ni expéditeur
  ni numéro du destinataire.
- **Le mois** (`/recap`) : dépôts, distributions, frais encaissés, à
  percevoir, par statut, par trajet, par genre — exports CSV.

## Contexte camerounais

- Frais en **FCFA**, Mobile Money comme moyen de paiement, numéros **+237**
  normalisés (MTN, Orange, Nexttel détectés).
- Villes desservies : Douala, Yaoundé, Bafoussam, Bamenda, Garoua, Maroua,
  Ngaoundéré, Bertoua, Ebolowa, Kribi, Limbe, Buea.
- **Français + anglais**, mobile-first, pour téléphone d'entrée de gamme.

## Comptes de démonstration

| Rôle | Adresse | Mot de passe |
|---|---|---|
| Responsable | `ada@logistique.cm` | `Log2026!` |
| Agent | `mbarga@logistique.cm` | `Log2026!` |

L'agent dépose les colis et fait avancer les statuts ; le responsable seul
touche aux comptes et aux réglages.

## Lancer

```bash
# API (port 9400)
cd backend
EVO_LOG_DATABASE_URL="sqlite:///../evo_log.db" \
EVO_LOG_SEED_DEMO=true EVO_LOG_DEMO_MODE=true \
EVO_LOG_JWT_SECRET="un-secret-long" \
python -m uvicorn app.main:app --port 9400

# Frontend (port 4400)
cd frontend
npm install
npm run dev   # http://localhost:4400
```

## Vérifier

```bash
cd backend && python -m pytest tests -q   # 11 tests
```

Parcours réel testé : login → `/accueil`, `/colis`, `/recap`, `/reglages` en
200 ; `/suivi` et `/suivi/[numero]` publics sans compte ; `/etat` rend les
compteurs ; exports CSV en `;` + BOM UTF-8.

## Stack

- Backend : FastAPI + SQLAlchemy + SQLite, sessions par cookie JWT.
- Frontend : Next.js 16 + React 19 + TypeScript strict, socle `@cadc/kit`.
