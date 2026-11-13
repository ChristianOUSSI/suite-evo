# KOLO BOUTIQUE · backend

L'API du comptoir. FastAPI, SQLAlchemy 2, SQLite, aucun appel réseau sortant.

## Démarrer

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8300 --reload
```

## Routes

| Chemin | Effet |
| --- | --- |
| `GET /health` | SERVICE, mode démo, phrase sur les envois |
| `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | Séance en cookie httpOnly, 12 h |
| `GET /boutique` · `PUT /boutique` | Les mots du comptoir, ses rails, son abonnement hebdo |
| `GET /mains` · `POST /mains` | L'équipe ; seul le tenancier ajoute une main |
| `GET /produits` · `POST /produits` · `PATCH /produits/{id}` · `DELETE /produits/{id}` | Le rayon, filtrable par `motif`, `categorie`, `alertes` |
| `POST /dictee/analyse` | La phrase devient une ligne prête à écrire, sans rien écrire |
| `POST /dictee` | La phrase entre au cahier |
| `GET /ventes` · `POST /ventes` · `POST /ventes/{id}/annuler` | Les sorties, la rayure qui remet la marchandise en réserve |
| `GET /entrees` · `POST /entrees` | Les rachats, qui remélangent le coût moyen |
| `GET /depenses` · `POST /depenses` | Transport, loyer, salaire, facture |
| `GET /tableau` · `GET /journees` | La journée, la semaine, la série de sept jours, les meilleures ventes |
| `GET /caisse` · `POST /caisse/declarer` | Le fond, l'attendu, le comptage, l'écart |
| `GET /exports/ventes.csv` · `stock.csv` · `journees.csv` · `depenses.csv` | Feuilles en français, BOM, points-virgules |

## La dictée, et ses bornes

`app/services/dictee.py` lit une phrase et pose une intention. Trois verbes :
entrée (`rachat`, `entrée`, `réception`), dépense (`dépense`, `frais`, `paye`),
vente (le reste, et `vend`, `cède`). Le premier nombre dit la quantité, le
dernier dit le prix ; un nombre seul se lit toujours comme le prix d'une unité.

Le tri refuse plutôt que de deviner :

- aucun article du comptoir ne correspond à la phrase, 422 ;
- la phrase demande plus que le stock, la réponse porte un `doute` et l'écriture
  est refusée ;
- les mots de rail (`momo`, `orange`, `cash`, `crédit`) sont retirés du
  vocabulaire avant la recherche d'article : `2 fanta 900 momo` vend un soda,
  pas une recharge. C'est un arbitrage, il est écrit dans le code.

## Le coût, et pourquoi une journée close ne bouge plus

Le prix d'achat d'un article est un **coût moyen pondéré** : chaque entrée
recalcule `(stock × coût actuel + quantité × coût du rachat) / nouveau stock`.
Une vente enregistre ce coût sur sa ligne. Racheter plus cher le lendemain ne
réécrit pas la veille, et le bénéfice d'une vente passée se retrouve à l'octet
près. C'est pour ça aussi qu'un `PATCH /produits/{id}` refuse de corriger le
prix d'achat tant qu'il reste du stock : ça se fait par une entrée.

## Tests

```bash
pytest -q      # 12 tests
```

Ils couvrent la séance et son cookie, le tableau, la dictée de vente, de rachat
et de dépense, les deux refus (article inconnu, stock dépassé), le coût moyen,
la rayure qui remet en réserve, le comptage du soir avec son écart, une feuille
CSV et un rail coupé.
