# evo-immo - Annonces immobilières

Le registre d'une agence immobilière camerounaise : les biens avec leur prix
et leur propriétaire, les demandes des clients avec leur canal, les visites
avec leur issue - et une page publique des annonces à envoyer sur WhatsApp.

## Ce que le produit fait

- **Les biens** (`/biens`) : fiche par bien - type (maison, appartement,
  chambre, terrain, bureau, commercial), ville, quartier, prix en FCFA,
  surface, chambres, propriétaire et son numéro camerounais. Le statut se
  change d'un geste : disponible, en négociation, loué, vendu, retiré.
- **Les demandes** (`/demandes`) : chaque contact client a son canal -
  téléphone, WhatsApp, visite, panneau, bouche à oreille - et son suivi :
  nouvelle, contactée, visite, convertie, perdue.
- **Les visites** (`/visites`) : le bien, le jour, l'heure, le client ;
  l'issue se note après - conclue, absente, refusée. Le passé ne se réécrit pas.
- **L'accueil** (`/accueil`) : biens en main, demandes neuves, visites du jour.
- **Le mois** (`/recap`) : visites par issue, demandes par quartier, valeur
  des biens vendus/loués - recalculé à la demande, exports CSV.
- **`/annonces`** (public) : les biens disponibles, sans compte - le lien à
  envoyer sur WhatsApp. Ne montre jamais le propriétaire ni les demandes.

## Contexte camerounais

- Prix en **FCFA**, numéros normalisés **+237** (MTN, Orange, Nexttel détectés).
- **Français + anglais**, mobile-first, pour téléphone d'entrée de gamme.
- Mobile Money et coupures réseau : tout est local, la séance tient dans un cookie.

## Comptes de démonstration

| Rôle | Adresse | Mot de passe |
|---|---|---|
| Responsable | `ada@immo.cm` | `Immo2026!` |
| Agent | `mbarga@immo.cm` | `Immo2026!` |

L'agent fiche les biens, les demandes et les visites ; le responsable seul
touche aux comptes et aux réglages.

## Lancer

```bash
# API (port 9300)
cd backend
EVO_IMMO_DATABASE_URL="sqlite:///../evoimmo.db" \
EVO_IMMO_SEED_DEMO=true EVO_IMMO_DEMO_MODE=true \
EVO_IMMO_JWT_SECRET="un-secret-long" \
python -m uvicorn app.main:app --port 9300

# Frontend (port 4300)
cd frontend
npm install
npm run dev   # http://localhost:4300
```

## Vérifier

```bash
cd backend && python -m pytest tests -q   # 10 tests
```

Parcours réel testé : login → `/accueil`, `/biens`, `/demandes`, `/visites`,
`/recap`, `/reglages` en 200 ; `/annonces` public sans compte ; `/etat` rend
les compteurs ; exports CSV en `;` + BOM UTF-8.

## Stack

- Backend : FastAPI + SQLAlchemy + SQLite, sessions par cookie JWT.
- Frontend : Next.js 16 + React 19 + TypeScript strict, socle `@cadc/kit`
  (thème, i18n, formats FCFA, villes du Cameroun).
