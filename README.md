# suite-evo — la maison des logiciels de comptoir

Vingt-deux produits CODE AXIS DIGITAL CAMEROON, un même socle : chaque métier
a son logiciel, chaque logiciel tient sur un téléphone, en français comme en
anglais, en FCFA, avec Mobile Money et les numéros camerounais.

## Le portail

`portail/frontend` — la page d'accueil de la suite (port **5800**) : les 22
produits, leur adresse, et un témoin qui dit si chacun répond.

```bash
cd portail/frontend
npm install
npm run dev    # http://localhost:5800
```

## Le catalogue

| Produit | Métier | Front | API |
|---|---|---|---|
| evo-tontine | Tontines & épargne | 3500 | 8500 |
| evo-crm | Portefeuille clients | 3600 | 8600 |
| evo-presence | Pointage des présences | 3700 | 8700 |
| evo-hotel | Réservation hôtelière | 3800 | 8800 |
| evo-shop | Point de vente | 3900 | 8900 |
| evo-school | Frais scolaires & reçus | 4000 | 9000 |
| evo-clinic | Dossiers patients | 4200 | 9200 |
| evo-immo | Annonces immobilières | 4300 | 9300 |
| evo-log | Logistique & colis | 4400 | 9400 |
| evo-market | Marketplace | 4500 | 9500 |
| evo-docs | Gestion documentaire | 4600 | 9600 |
| evo-call | Centre d'appels | 4700 | 9700 |
| evo-auto | Vente automobile | 4800 | 9800 |
| evo-import | Fret & import | 4900 | 9900 |
| evo-bijou | Bijouterie | 5000 | 10000 |
| evo-moto | Motos & atelier | 5100 | 10100 |
| evo-cars | Voitures & pièces | 5200 | 10200 |
| evo-wear | Prêt-à-porter | 5300 | 10300 |
| evo-gaz | Distribution de GPL | 5400 | 10400 |
| evo-carnet | Carnet numérique | 5500 | 10500 |
| evo-agent | Agent IA autonome | 5600 | 10600 |
| evo-voice | Dictée & commande vocale | 5700 | 10700 |

Chaque dossier `evo-*` contient son `README.md`, son `backend/` (FastAPI +
SQLite) et son `frontend/` (Next.js sur `@cadc/kit`, français + anglais,
mobile-first). En mode démo, **rien ne quitte la machine** : aucun SMS,
aucun appel, aucun argent ne part.

Le socle partagé vit dans `cadc/kit` — synchronisé par
`node ../../cadc/kit/sync.mjs` avant chaque lint/build.
