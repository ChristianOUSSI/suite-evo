# PALABRE · backend

L'API du carnet. Elle détient les créances, la séquence de relance, les
encaissements et le portail client. Elle ne rend aucune page HTML : le frontend
Next.js s'en charge.

Stack : FastAPI, SQLAlchemy 2, Pydantic v2, SQLite. Aucun service externe.

## Démarrer

```bash
cd backend
python -m venv .venv
. .venv/bin/activate            # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload   # http://127.0.0.1:8000
```

La base est créée au premier démarrage et remplie du jeu de démonstration
(quincaillerie, 12 clients, 23 factures, relances, paiements, promesses).
Le document est journalier : `palabre.db` suffit à tout reconstruire.

```bash
python -m app.services.seed            # complète la base si elle est vide
python -m app.services.seed --reset    # efface tout et recharge la démo
```

Documentation interactive : `http://127.0.0.1:8000/docs`.

## Variables d'environnement

Préfixe `PALABRE_`, lues dans `.env`.

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./palabre.db` | Chaîne de connexion SQLAlchemy |
| `JWT_SECRET` | secret de développement | Signature des sessions. À changer hors locale |
| `JWT_TTL_HOURS` | `12` | Durée de validité du cookie |
| `COOKIE_SECURE` | `false` | Cookie `Secure`. Mettre `true` en HTTPS |
| `PUBLIC_BASE_URL` | `http://localhost:3000` | Base des liens de paiement clients |
| `SEED_DEMO` | `true` | Remplit la base au démarrage si elle est vide |
| `DEMO_MODE` | `true` | Force la simulation des paiements et des envois |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | Origines autorisées |

## Session

`POST /auth/login` vérifie le mot de passe (hachage `scrypt`, sel aléatoire) et
dépose un JWT HS256 dans le cookie httpOnly `palabre_session`. Le cookie est
`SameSite=Lax` : le portail client ouvert depuis WhatsApp garde la session du
naviguateur sans que le commerçant ait à se reconnecter. Toutes les routes
privées passent par `app/deps.py`, qui résout aussi le commerçant courant : un
jeton volé ne donne accès qu'aux créances de son propre commerçant.

`GET /auth/me` sert à la fois de vérification de session et de source des
informations d'en-tête (nom, quartier, canaux actifs).

## Routes

| Méthode | Chemin | Usage |
| --- | --- | --- |
| `POST` | `/auth/login` · `/auth/logout` | Ouvrir et fermer la session |
| `GET` | `/auth/me` | Session courante |
| `GET` | `/dashboard` | Totaux, étiquettes, graphique de la semaine |
| `GET` `POST` | `/invoices` | Liste filtrable et création d'une créance |
| `GET` | `/invoices/{reference}` | Fiche détaillée, relances, paiements, promesses |
| `POST` | `/invoices/import/check` | Pré-contrôle d'un lot CSV (doublons) |
| `POST` | `/invoices/import` | Entrée d'un lot de créances |
| `POST` | `/invoices/{reference}/remind` | Relance immédiate sur un canal |
| `POST` | `/invoices/{reference}/promise` | Noter une promesse de paiement |
| `PATCH` | `/invoices/{reference}/status` | Passer en litige, rouvrir, solder |
| `GET` | `/payments` | Journal d'encaissement |
| `POST` | `/invoices/{reference}/payments` | Encaissement au comptoir |
| `GET` | `/reminders` | Fil des relances, planifiées et envoyées |
| `GET` | `/reminders/sequence` | Les cinq paliers de la séquence |
| `POST` | `/reminders/run` | Déclencher les relances dues (`?dry_run=true` pour simuler) |
| `GET` `PATCH` | `/settings` | Tons, canaux, relances auto, point du soir |
| `GET` | `/public/invoices/{token}` | Avis vu par le client |
| `POST` | `/public/invoices/{token}/pay` | Règlement en ligne |

Les routes `/public/*` sont les seules à se passer de session : c'est le jeton
d'accès de 24 caractères qui fait office de clé.

## Règles métier

**Relance.** Cinq paliers attachés à la date d'échéance : J-3 en SMS, J en
WhatsApp, J+3 en WhatsApp, J+7 en SMS, J+14 en message vocal. Chaque facture
ouverte porte sa copie de la séquence, recalculée si l'échéance change. Si le
canal d'un palier est coupé dans les réglages, on bascule sur WhatsApp, puis
SMS, puis vocal ; si aucun canal n'est ouvert, la relance reste à l'état
planifiée et le frontend l'affiche comme suspendue. Les brouillons sont régénérés
au changement de ton ou de coordonnées, jamais après envoi : un message parti
ne se réécrit pas.

**Ton.** `courtois` ou `ferme`. Le ferme reste poli, il ne menace de rien et
n'évoque ni avocat ni huissier.

**Client protégé.** Un client qui a coché la fin des relances (`opt_out`) ne
reçoit plus rien ; ses factures restent au carnet et se règlent quand même par
le lien. Une créance en litige voit ses relances planifiées annulées, et une
créance réglée ne se rouvre pas.

**Statuts.** `open`, `paid`, `disputed`, et l'étiquette `promise` quand une
promesse active couvre le solde. Le reste à régler se déduit des paiements
confirmés.

**Import.** Un lot est accepté s'il n'existe pas déjà, ligne par ligne, le même
numéro canonique, le même objet (comparaison insensible à la casse et aux
espaces), le même montant et la même échéance. Le contrôle est fait avant
l'écriture, et les doublons internes au fichier sont signalés avant les doublons
déjà au carnet. Les lignes refusées ne bloquent pas les autres.

**Argent.** Paiement Mobile Money : 3 % de frais, arrondis. Abonnement du
plan : 35 000 FCFA par mois, affiché dans le point du soir. Un acompte est
accepté, un trop-perçu est refusé.

**Simulation.** En `DEMO_MODE`, `POST /public/invoices/{token}/pay` écrit le
reçu et met à jour le solde sans appeler d'opérateur, et `/reminders/run` marque
les relances envoyées avec une référence `DEMO-xxxxx`. Aucun numéro réel n'est
joint.

## Tests

```bash
pytest -q
```

Treize tests, contre une base SQLite séparée (`tests/palabre_test.db`, recréée
à chaque exécution) : connexion, mot de passe erroné, routes privées protégées,
totaux du tableau de bord, liste et fiche d'une créance, import avec doublons
déjà au carnet et doublons internes au fichier, promesse, relances idempotentes,
relance immédiate qui conserve la suite planifiée, réglages, puis paiement
partiel, solde, et refus sur une facture déjà soldée. Deux autres tests portent
sur la canonisation et l'affichage des numéros camerounais.

## Numéros et dates

Les numéros camerounais sont canonisés à la saisie : `6 77 08 41 96`,
`+237 677 08 41 96` ou `00237677084196` donnent `+237677084196`. Les montants
voyagent en entiers de francs CFA, jamais en flottants. Les dates d'échéance
sont des dates, pas des horodatages : les paliers de relance se comparent au
jour local.
