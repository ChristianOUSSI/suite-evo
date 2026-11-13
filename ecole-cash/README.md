# ÉCOLE CASH · la caisse d'une école de Douala

ÉCOLE CASH remplace le cahier de l'écolage et le classeur des relances. La
caissière encaisse, le reçu part au parent avec un code à vérifier, et les
termes qui traînent sont rappelés d'eux-mêmes, par WhatsApp ou par SMS. La
directrice, elle, ouvre une page et voit où en est l'année.

Le produit est livré en édition de démonstration : une école inventée, un jeu de
données garni par le semis, des messages qui ne quittent pas la machine. Tout ce
qui touche de l'argent réel ou un opérateur est bouché volontairement, et la
caisse l'affiche au moment du geste, pas seulement en pied de page.

## Ce que fait la caisse

- Un anneau d'écolage par classe : scolarité, cantine, transport, autres, et le
  nombre de termes. Le total de l'année se coupe en termes tout seuls.
- Le guichet : on cherche une famille, on tape le montant, on choisit le rail
  (espèces, MoMo, Orange Money, chèque, virement), le reçu est écrit.
- Imputation automatique : le versement solde les termes les plus anciens, et
  le trop-perçu reste visible, en négatif de reste, sans inventer d'écritures.
- Échéancier posé famille par famille ou engagé classe par classe pour toute
  l'année.
- Relances à deux régimes : un rappel avant échéance et un avis après
  tolérance, tous deux réglés à l'écran ; tir manuel quand on veut la main.
- Reçu public : le parent colle le code de seize caractères, il voit son reçu,
  sans compte et sans lire les autres familles.
- Caisse du jour : ce qui est rentré, rail par rail, le fond de caisse, ce
  qu'on compte le soir, l'écart, et la série des jours.
- Cinq feuilles CSV en téléchargement, en français, séparées par des
  points-virgules.

## Lancer le projet

Deux services, dans deux terminaux. Depuis la racine du dossier `ecole-cash`.

**1. L'API Python**, sur `http://127.0.0.1:8200` :

```bash
cd backend
python -m venv .venv && . .venv/bin/activate   # ou .venv\Scripts\activate sous Windows
pip install -r requirements.txt
cp .env.example .env                            # puis changer CASH_JWT_SECRET
uvicorn app.main:app --port 8200 --reload
```

La base SQLite `ecole_cash.db` se crée et se remplit du jeu de démonstration au
premier démarrage. Le port 8200 est une convention de poste de travail : il
n'est écrit nulle part dans le backend, c'est le frontend qui l'attend par
défaut (`CASH_API_URL`).

**2. Le site Next.js**, sur `http://localhost:3200` :

```bash
cd frontend
npm install
npm run dev
```

`CASH_PUBLIC_BASE_URL` côté backend (défaut `http://localhost:3200`) sert à
tisser les liens de vérification des reçus. `CASH_API_URL` côté frontend est
l'adresse de l'API.

**Comptes de démonstration** : `caisse@tilleuls.cm` / `Caisse2026!` (Marie-Josée
Ette, comptable) et `direction@tilleuls.cm` / `Caisse2026!` (Sister Ndong Bell,
directrice). Le Groupe Scolaire Les Tilleuls, Bonapriso, Douala.

## Comment tout cela est coupé

- Un encaissement écrit un reçu et solde les termes. Aucun opérateur Mobile
  Money n'est appelé, aucun compte n'est débité.
- Une relance passe à l'état envoyé avec une référence de démonstration. Rien
  ne part chez un agrégateur de SMS ni sur WhatsApp.
- Le comptage du soir écrit un écart dans le journal. Le tiroir reste virtuel.
- Les montants, les familles et les numéros du jeu de démonstration sont
  fictifs.

Pour repartir d'une caisse vide ou recharger la démo :

```bash
cd backend
python -m app.services.seed --reset
```

## Architecture

```
ecole-cash/
  backend/    FastAPI + SQLAlchemy 2 + SQLite   (api, échéanciers, relances, reçus, exports)
  frontend/   Next.js 16 App Router + CSS propre (guichet, journal, familles, réglages)
```

Le frontend ne parle qu'à l'API. Le découpage en termes, le solde, les
étiquettes de statut, les libellés de montant et le texte des messages vivent
dans `backend/app/services/` ; la caisse les affiche tels quels. Le reçu public
(`/verif/{jeton}`) est rendu par le frontend et nourri par
`/public/recus/{jeton}`.

## Vérifications

```bash
cd backend && pytest -q        # 5 tests : mention démo, séance ouverte et fermée, deux rôles d'une même école, tableau de bord, réglages
cd frontend && npm run lint && npm run build
```

Côté frontend, les trois sont passées sur le poste le 31 octobre 2026, avec un
Node 24.22.2 portable (hors dépôt, dans `~/tools`) : `npm install`, `npm run
lint` et `npm run build` sans erreur, `tsc --noEmit` propre, et quatre écrans
lus dans le DOM du serveur produit (`/`, `/connexion`, `/app`,
`/verif/DEMO-JETON`).

Côté backend, `pytest` n'a pas pu tourner : Python est absent du PATH sur ce
poste. Le contrat d'API a été vérifié à la lecture de `backend/app/routers/` et
de `backend/app/services/present.py`, pas à l'exécution, et les douze écrans
protégés n'ont jamais été remplis par la base de démonstration.
