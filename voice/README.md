# CADC VOICE · le standard qui répond

CADC VOICE décroche à la place de l'accueil d'une université, d'une école ou
d'une clinique de Douala. La voix lit les fiches que vos agents ont écrites,
propose une place au guichet, note ce qu'elle ne sait pas dire et pousse un SMS
de confirmation. La console, elle, garde la trace de tout : chaque appel, chaque
mot, chaque promesse de rappel, avec l'heure à laquelle elle devait être tenue.

L'édition posée ici est une démonstration : le jeu de données est inventé,
aucun tronc SIP n'est branché, aucun SMS ne part. Les références commencent par
`DEM` pour qu'on ne les confonde pas avec du vrai trafic, et l'écran le rappelle
à chaque page.

## Ce que tient le standard

- Un répertoire parlé : une fiche = une affirmation, les mots qui la font sortir,
  le texte exact lu au téléphone, et ce qu'on répond si l'appelant insiste.
- Des guichets de rendez-vous : tranche de quinze ou trente minutes, avance
  d'une journée, horizon de deux semaines, référence dictable posée à l'appelant.
- Une main courante : nom, numéro, urgence, promesse de rappel. Ce qui dépasse
  la fenêtre monte en retard sur la plaque du matin.
- Des relances : confirmation de place, accusé de message, rappel de la veille.
  La tournée part seule au passage du matin, ou à la main depuis la page Envois.
- Un arbre de touches par poste, des horaires par jour, des fermetures qui passent
  avant tout le reste, y compris les jours fériés camerounais importés du
  calendrier national.
- La touche 9 : la voix bascule en anglais, et les fiches, rendez-vous et accusés
  suivent l'appelant dans sa langue.
- Le journal exporté en feuilles de calcul, prêtes pour Excel et LibreOffice.

## Lancer le projet

Deux services, dans deux terminaux, depuis la racine du dossier `voice`.

**1. L'API Python**, sur `http://127.0.0.1:8100` :

```bash
cd backend
python -m venv .venv && . .venv/bin/activate    # ou .venv\Scripts\activate sous Windows
pip install -r requirements.txt
cp .env.example .env                            # puis changer VOICE_JWT_SECRET
uvicorn app.main:app --reload --port 8100
```

Au premier démarrage, la base SQLite se crée et se remplit du jeu de
démonstration. Voir `backend/README.md`.

**2. La console Next.js**, sur `http://localhost:3100` :

```bash
cd frontend
npm install
npm run dev
```

La console renvoie `/api/*` vers l'API ; l'adresse se change avec
`VOICE_API_URL`. Voir `frontend/README.md`.

**Compte de démonstration** : `standard@iswouri.cm` / `Voix2026!`
(Régine Eballe, Institut Supérieur du Wouri, Bonapriso).

## Repartir de zéro

```bash
cd backend
python -m app.services.seed --reset
```

## Comment tout cela est coupé

- Un appel simulé écrit une fiche d'appel, une dictée complète et, s'il y a lieu,
  un rendez-vous ou un mot. Personne n'est appelé : le poste qui répond est un
  modèle, pas une ligne téléphonique.
- Un envoi passe à `envoye` avec une référence `DEM-xxxxx`. Aucun agrégateur SMS
  ni WhatsApp n'est contacté, la caisse des SMS ne calcule que ce qu'elle
  facturerait.
- Les numéros suivent le plan camerounais (9 chiffres, `+237`), les montants sont
  en FCFA, et le fonds de réponses reprend les questions réellement posées à un
  standard de Bonapriso.

Brancher un vrai tronc SIP ou un agrégateur reste un travail d'intégration,
chiffré séparément.

## Architecture

```
voice/
  backend/   FastAPI + SQLAlchemy 2 + SQLite   (standard, répertoire, agenda, rappels)
  frontend/  Next.js 16 App Router + CSS écrit à la main (console, offre, test d'appel)
```

La logique métier est du côté Python : ouverture d'un poste, choix d'une fiche,
créneaux d'un guichet, fenêtre de rappel, tournée des relances, jours fériés. Elle
tient dans `backend/app/services/`. La console n'affiche que ce que l'API répond,
et les formulaires renvoient exactement les mêmes routes que la voix utilise quand
un appelant touche un chiffre.

Un produit, une interface. Ce que VOICE montre ne ressemble ni au carnet de
comptes de PALABRE, ni aux autres applications de l'atelier : la grille, les
couleurs et les mots viennent du métier du standard, pas d'un modèle.

## Identité

Le nom se dit au téléphone : « CADC VOICE, le standard décroche ». Pas de
slogan, pas de promesses d'intelligence.

Voix : Newsreader pour les titres et pour la dictée, Karla pour le texte de
travail, Space Mono pour ce qui doit être lu chiffre par chiffre, les heures,
les références `RDV2710-XKQP` et les numéros.

Couleurs : un fond de nuit (`#10151a`) pour les écrans de conduite, trois
accents qui veulent dire quelque chose. Ambre pour ce qui attend, mousse pour
ce qui est tenu, rouille pour ce qui a raté. Une pastille garde le même sens
d'un écran à l'autre ; rien n'est coloré pour faire joli.

Layout : des grilles inégales, des panneaux qui n'ont pas la même largeur selon
ce qu'ils portent, des listes qui s'arrêtent quand elles n'ont plus rien à dire.
Aucun carrousel, aucune carte centrée, aucun tiret décoratif. Les titres sont
écrits comme on parle au comptoir, sans capitale plaquée.

## Vérifications

```bash
cd backend && pytest -q                     # 60 tests : session, voix, agenda, rappels, bilinguisme
cd backend && python scripts/verif_console.py   # chaque payload des formulaires, contre l'API qui tourne
cd frontend && npm run lint && npm run build
```
