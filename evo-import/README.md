# evo-import — Fret & import

Le quai d'un transitaire camerounais : chaque envoi avec son numéro de
suivi à dix signes, son mode (maritime, aérien, terrestre, express), son
statut — et une page publique où le destinataire suit son colis sans
compte.

## Ce que le produit fait

- **Les envois** (`/envois`) : description du contenu, expéditeur et pays
  de départ, destinataire et ville d'arrivée, poids, valeur déclarée,
  frais, client du carnet. Le numéro de suivi (`EVIO-…` à dix signes) se
  génère tout seul. Le parcours avance d'un geste : en attente → en
  transit → en douane → livré, ou bloqué/annulé — chaque passage laisse
  sa ligne datée dans le suivi, rien ne s'efface.
- **Les clients** (`/clients`) : chaque expéditeur ou destinataire avec
  son numéro camerounais (MTN, Orange, Nexttel) et son type —
  particulier, entreprise, revendeur.
- **Le mois** (`/recap`) : envois du mois, frais, valeur déclarée, par
  statut, par mode, par ville — recalculé à la demande, exports CSV.
- **`/suivi` public** : le destinataire tape le numéro sur
  `/suivi?numero=…` et lit le parcours complet — sans compte, sans appel.
  À envoyer sur WhatsApp avec le numéro.
- Tout en **français + anglais**, palette et polices CADC, mobile-first.

## Lancer

```bash
# API (depuis backend/)
EVO_IMPORT_SEED_DEMO=true EVO_IMPORT_DEMO_MODE=true \
  python -m uvicorn app.main:app --port 9900

# Frontend (depuis frontend/)
npm install
EVO_IMPORT_API_URL=http://127.0.0.1:9900 npm run dev -- --port 4900
```

Comptes de démonstration : `ada@import.cm` / `Import2026!` (responsable),
`mbarga@import.cm` / `Import2026!` (agent).

En mode démo, aucun SMS, aucun appel, aucun message ne quitte la machine.

## Vérification

```bash
cd backend && python -m pytest tests -q   # 12 tests
cd frontend && npm run lint && npx tsc --noEmit && npm run build
```
