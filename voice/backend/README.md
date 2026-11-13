# CADC VOICE · backend

L'API du standard. Elle détient le répertoire parlé, les postes et leurs
touches, les guichets de rendez-vous, la main courante et les relances. Elle ne
rend aucune page : la console Next.js s'en charge, et la voix n'est qu'un modèle
qui parle à travers les mêmes routes.

Stack : FastAPI, SQLAlchemy 2, Pydantic v2, SQLite, PyJWT. Aucun service
externe, aucun opérateur téléphonique.

## Démarrer

```bash
cd backend
python -m venv .venv
. .venv/bin/activate            # Windows : .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8100
```

Au premier démarrage la base est créée et remplie du jeu de démonstration
(un institut de Bonapriso, trois postes, 14 fiches, treize jours d'appels, des
rendez-vous à venir, des mots en attente, les jours fériés de l'année). Tout
tient dans `voice.db`.

```bash
python -m app.services.seed            # complète la base si elle est vide
python -m app.services.seed --reset    # efface tout et recharge la démo
```

Documentation interactive : `http://127.0.0.1:8100/docs`.

## Variables d'environnement

Préfixe `VOICE_`, lues dans `.env`.

| Variable | Défaut | Rôle |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./voice.db` | Chaîne de connexion SQLAlchemy |
| `JWT_SECRET` | secret de développement | Signature des sessions. À changer hors locale |
| `JWT_TTL_HOURS` | `12` | Durée de validité du cookie |
| `COOKIE_NAME` | `voice_session` | Nom du cookie httpOnly |
| `COOKIE_SECURE` | `false` | Cookie `Secure`. Mettre `true` en HTTPS |
| `PUBLIC_BASE_URL` | `http://localhost:3100` | Base des liens posés dans les SMS |
| `DEMO_MODE` | `true` | Force la simulation des appels et des envois |
| `SEED_DEMO` | `true` | Remplit la base au démarrage si elle est vide |
| `CORS_ORIGINS` | `http://localhost:3100,http://127.0.0.1:3100` | Origines autorisées |

## Session

`POST /auth/login` vérifie le mot de passe (`scrypt`, sel aléatoire) et dépose un
JWT HS256 dans le cookie httpOnly `voice_session`, `SameSite=Lax`. Toute route
privée passe par `app/deps.py`, qui résout aussi l'établissement courant : le
jeton d'un standardiste ne donne accès qu'aux fiches de son établissement, et
l'identifiant d'un poste ou d'un guichet pris ailleurs renvoie un 404 plutôt
qu'une donnée d'un voisin.

`GET /auth/me` sert à la fois de contrôle de session et de source de l'en-tête
de la console (nom de la maison, quartier, agent connecté).

## Routes

| Méthode | Chemin | Usage |
| --- | --- | --- |
| `POST` `GET` `DELETE` | `/auth/login` · `/auth/me` · `/auth/logout` | Séance par poste |
| `GET` | `/dashboard` | Tableau du matin, plaques, heure de pointe, trous du fonds |
| `GET` `POST` | `/standard/ouvrir` · `/standard/appeler` | Ce que la voix dit, puis ce qu'elle fait d'un appel |
| `GET` | `/standard/etat` | Plaque des postes : ouvert, fermé, reprise, saturé |
| `GET` | `/standard/guichets` | Guichets avec leur calendrier et leurs prochaines places |
| `GET` `POST` `PATCH` `DELETE` | `/lines`, `/lines/{id}` | Les postes décrochés |
| `GET` `POST` | `/lines/{id}/schedules`, `DELETE /schedules/{id}` | Fenêtres horaires par jour |
| `GET` `POST` `PATCH` `DELETE` | `/lines/{id}/menu`, `/menu/{id}` | Arbre de touches d'un poste |
| `GET` `POST` `DELETE` | `/closures` | Jours où rien ne décroche |
| `GET` `POST` | `/holidays` | Calendrier national camerounais, puis import d'une année |
| `GET` `POST` | `/answers`, `/answers/tester` | Fonds de réponses et essai d'une question |
| `GET` | `/answers/trous` | Questions revenues sans qu'aucune fiche ne sorte |
| `GET` `PATCH` `DELETE` | `/answers/{id}` | Une fiche, ses mots clefs, les touches qui mènent à elle |
| `GET` `POST` | `/appointments`, `/appointments/slots` | Places posées et places encore libres |
| `PATCH` `POST` | `/appointments/{id}`, `/appointments/{id}/rappel` | Venu, manqué, annulé, relancé |
| `GET` `POST` | `/messages` | Main courante, fil et retards |
| `PATCH` `DELETE` | `/messages/{id}` | Saisir, marquer rappelé, effacer |
| `GET` `POST` | `/contacts` | Carnet des numéros connus |
| `GET` `POST` | `/dispatches`, `/dispatches/relances` | Journal des envois et tournée du matin |
| `GET` `PUT` `POST` | `/settings`, `/settings/preview` | Mots, canaux, formule, aperçu de la salutation |
| `GET` `POST` | `/team` | Les mains qui tiennent la console |
| `GET` | `/calls`, `/calls/{id}` | Journal filtrable, fiche détaillée, dictée complète |
| `GET` | `/exports/*.csv` | Cinq feuilles prêtes pour le tableur |

## Règles métier

**La voix ne débite pas plus qu'une respiration.** Une dictée est coupée à 260
signes, à la phrase près. Les fiches du répertoire tiennent dans cette longueur,
et le texte lu est celui que l'agent a écrit, mot pour mot.

**Arbre de touches.** Touche `0` est réservée : elle ne se règle pas, elle
demande une personne. Touche `9` bascule l'anglais quand l'établissement est
réglé en bilingue. Un poste fermé ne laisse entendre que les touches qui
prennent un message ; les autres tombent sur la messagerie avec l'heure de
reprise.

**Guichets.** Un guichet porte sa tranche (`duration_min`), son pas
(`step_min`), son avance (`lead_days`) et son horizon (`horizon_days`). Une
place déjà posée n'est plus proposée. La référence `RDVJJMM-XXXX` est dictable :
l'appelant peut la répéter au comptoir.

**Occupation d'un poste.** La fenêtre d'occupation fait 25 minutes. Quand la
voix est déjà prise sur ce créneau, l'appelant est mis en file avec son rang, et
la main courante reçoit le rappel correspondant.

**Main courante.** Une promesse vaut `promised_at`, calculée depuis la fenêtre
de rappel de l'établissement (15 à 720 minutes). Ce qui dépasse l'heure monte
`en retard` sur le tableau, et la tournée ne touche qu'aux mots dus.

**Relances.** Trois motifs : confirmation de place, accusé de message, rappel de
la veille. `POST /dispatches/relances` pose les rappels dus et relâche les envois
programmés. En automatique, le simple chargement du tableau déclenche le passage
du matin.

**Fériés.** `GET /holidays?year=` rend le calendrier camerounais (jours fixes,
jours mobiles de Pâques calculés, trois fêtes musulmanes estimées et marquées «
à confirmer »). `POST /holidays` n'ajoute que ce qui manque, sans jamais écraser
une fermeture déjà posée à la main.

**Canaux.** SMS, WhatsApp et appel vocal ont chacun leur interrupteur. Un envoi
sur un canal coupé renvoie un 422 qui dit pourquoi, et la trace reste au journal
en état `echoue`. La caisse des SMS compte en segments : 153 signes en GSM-7, 70
en unicode, multipliés par le prix du segment réglé par l'établissement.

**Discrétion.** Quand elle est ouverte, la voix ne nomme personne dans
l'établissement : elle transmet au poste sans dire qui s'y trouve.

**Simulation.** En `DEMO_MODE`, `/standard/appeler` écrit la fiche et la dictée
sans appeler personne, et `/dispatches` marque l'envoi `envoye` avec une
référence `DEM-xxxxx`.

## Numéros et dates

Les numéros camerounais sont canonisés à la saisie : `6 77 08 41 96`,
`+237 677 08 41 96`, `00237677084196` donnent `+237677084196`. Un numéro à sept
chiffres, un fixe qui ne commence pas par `2` ou un mobile hors `6`/`7` sont
refusés. À l'affichage, le rythme local reprend : `6 77 08 41 96`.

Les dates d'ouverture sont des heures locales simples, les montants voyagent en
entiers de francs CFA, jamais en flottants.

## Tests

```bash
pytest -q
```

Soixante tests, contre une base SQLite séparée (`tests/voice_test.db`, recréée à
chaque exécution) : session et déconnexion, routes privées protégées, appels
simulés dans les deux langues, arbre de touches, guichets et créneaux, file
d'attente sur un poste saturé, main courante et retards, tournée de relances,
calendrier des fériés, carnet, import de tableur, caisse des SMS, réglages et
aperçu de la salutation. Trois familles de tests vérifient les règles du terrain
: numéros camerounais, dictée courte et absence de tirets de mise en page dans
tout ce que l'API rend.

Le script `scripts/verif_console.py` rejoue, contre une API qui tourne, chacun
des payloads envoyés par les formulaires de la console.
