# evo-docs - Gestion documentaire

Le classeur d'une maison camerounaise : documents, références à dix signes, échéances, vérification publique - sans dossier papier ni échéance oubliée. Code Axis Digital Cameroon.

## Ce que le produit fait

- **Les documents** (`/documents`) : chaque papier avec son titre, sa catégorie (facture, contrat, courrier, PV, identité, autorisation, autre), son émetteur, son destinataire, sa date et son échéance. La référence se génère toute seule - dix signes sans I, O, 0 ni 1, dicibles au téléphone. Le statut se change d'un geste : actif → archivé / annulé. Rien ne s'efface.
- **Les échéances** (`/echeances`) : les documents actifs avec une date limite, du plus urgent au plus lointain - retards, sous 30 jours, sans échéance. Une échéance dépassée se lit en rouge, elle ne disparaît pas.
- **L'accueil** (`/accueil`) : la vitre du bureau - documents actifs, retards, échéances à venir.
- **La vérification publique** (`/verifier`) : le contrôleur ou le client tape la référence à dix signes - le titre, la catégorie, la date, le statut - **sans compte**. La page ne montre ni émetteur ni échéance ni note.
- **La demande publique** (`/demande`) : le citoyen, le parent ou le client demande un document - nom, numéro, catégorie, motif - **sans compte**. La demande entre au registre (`/demandes`) : l'équipe la prépare, la remet ou la refuse, et le suivi se lit d'un geste.
- **Le mois** (`/recap`) : documents ajoutés, actifs, retards, par catégorie et par statut - recalculé à la demande, export CSV (`/api/exports/documents.csv`).
- **Les réglages** (`/reglages`) : la maison (nom, ville, quartier, téléphone), les comptes, l'export.

## Règles

- La date du document ne peut pas être dans le futur ; l'échéance ne peut pas précéder le document.
- Une échéance qui passe ne s'efface pas : le document reste actif et le récap le compte en retard.
- Archiver ou annuler change le statut, jamais le passé.

## Rôles

- **Responsable** : tout, plus les comptes et les réglages.
- **Agent** : les documents et les échéances - le quotidien du bureau.

## Compte de démonstration

| Rôle | Adresse | Mot de passe |
|---|---|---|
| Responsable | `ada@docs.cm` | `Docs2026!` |
| Agent | `mbarga@docs.cm` | `Docs2026!` |

## Lancer

```bash
# Backend - API sur http://127.0.0.1:9600
cd backend
python -m uvicorn app.main:app --port 9600

# Frontend - http://localhost:4600
cd frontend
npm install
npm run dev
```

Variables d'environnement backend : préfixe `EVO_DOCS_` (voir `backend/.env.example`).

## Vérifications

- `pytest` dans `backend/` : 9 tests (seed, documents, références, échéances, vérification publique, récap, export, droits).
- `npm run lint` et `npm run build` dans `frontend/` : verts.

## Français + anglais

Toute l'interface est bilingue (français par défaut, anglais à un geste). Les refus de l'API reviennent en `{code, fr, en}`. Numéros camerounais normalisés en `+237`, opérateurs MTN/Orange/Nexttel reconnus.
