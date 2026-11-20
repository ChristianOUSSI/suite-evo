# PALABRE — Recouvrement commercial

Le logiciel de recouvrement de la maison CADC : factures, relances,
paiements Mobile Money, tableau de bord. Pensé pour les entreprises
camerounaises qui courent après leurs créances sans tableur ni paperasse.

## Ce que fait PALABRE

- **Factures** : une ligne par créance, client, montant en FCFA, date
  d'échéance, statut (à relancer, partielle, soldée, abandonnée).
- **Relances** : l'historique des rappels par client — lettre, appel,
  WhatsApp — pour savoir qui a déjà été relancé et quand.
- **Paiements MoMo** : encaissements MTN/Orange/Nexttel Money rattachés
  à la facture, reste à percevoir calculé.
- **Tableau de bord** : ce qui rentre ce mois, ce qui stagne, les plus
  grosses créances.
- **Rappels** : notifications internes avant échéance et relances dues.
- **Réglages** : mentions du reçu, devise XAF, paramètres de l'entreprise.
- **Exports CSV** : factures et paiements pour la compta.

## Public

`routers/public.py` expose une surface sans compte (consultation filtrée).
En interne, tout est derrière JWT.

## Démo

- API : `uvicorn app.main:app` depuis `backend/`, port **8000**
- Front : `npm run dev` depuis `frontend/`, port **3000**
- Compte démo : `patron@nanafils.cm` / `Palabre2026!`

Mode démo : aucun vrai Mobile Money, aucun SMS — tout reste dans la
machine (`/health` le dit).

## Vérification

```bash
cd backend && python -m pytest tests -q
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```

## Stack

FastAPI + SQLAlchemy + SQLite (backend), Next.js 16 + React 19
(frontend). Bilingue FR/EN, FCFA, numéros `+237`, mobile-first.
