# KOLO BOUTIQUE · le cahier du comptoir

KOLO BOUTIQUE remplace la feuille de papier sur le comptoir d'une alimentation
générale de Douala. Le tenancier dicte une phrase de cinq secondes, et la vente,
le rachat ou la dépense entre au cahier. Le soir, il sait ce que la journée a
rapporté, ce qui reste en réserve et ce qu'il faut racheter demain matin.

Le produit est livré en édition de démonstration : une boutique inventée, un
rayon garni par le semis, des voix qui ne viennent d'aucun WhatsApp. Tout ce qui
touche de l'argent réel ou un opérateur est bouché volontairement, et le comptoir
l'affiche à l'écran.

**État du chantier : l'API est écrite et testée (12 tests), l'interface est
écrite, construite et lue dans le DOM contre la base de démonstration. Ce qui
manque : la revue visuelle à l'œil, les clics réels dans la console de dictée et
les écritures de réglages non essayées.**

## Ce que fait le comptoir

- **La dictée.** Une phrase comme `2 fanta 900 momo`, `rachat 10 spaghetti 520`
  ou `dépense taxi Bonanjo 1500` devient une écriture du cahier. Le tri ne
  devine jamais un article absent du comptoir et rend les mains quand la phrase
  demande plus que le stock n'en a.
- **Le rayon.** Articles, catégories, unités, prix d'achat, prix de vente, seuil
  d'alerte, et les mots que la voix dit pour chaque article.
- **Le coût moyen pondéré.** Chaque rachat remélange le stock déjà là avec le
  nouveau à son prix. Une vente fige son coût sur sa ligne : le bénéfice d'une
  journée passée ne bouge plus jamais.
- **La journée.** Chiffre, coût, bénéfice brut, dépenses, bénéfice net, marge,
  ticket moyen, recettes en espèces.
- **Le tiroir du soir.** Le fond, le comptage, l'écart écrit même quand il fâche.
- **Quatre feuilles CSV** en français, séparées par des points-virgules.

## Lancer l'API

Depuis la racine du dossier `kolo-boutique`.

```bash
cd backend
python -m venv .venv && . .venv/bin/activate   # ou .venv\Scripts\activate sous Windows
pip install -r requirements.txt
cp .env.example .env                            # puis changer KOLO_JWT_SECRET
uvicorn app.main:app --port 8300 --reload
```

La base SQLite `koloboutique.db` se crée et se remplit du jeu de démonstration
au premier démarrage.

**Comptes de démonstration** : `tenanciere@tchuentecahier.cm` / `Kolodo2026!`
(Brigitte Tchuenté, tenancière) et `vendeuse@tchuentecahier.cm` / `Kolodo2026!`
(Estelle Mbarga, vendeuse). Alimentation Générale Tchuenté, Ndokoti, Douala.

## Comment tout cela est coupé

- Une dictée écrit au cahier. Aucun vocal WhatsApp n'est reçu, aucun média
  n'est transcrit, aucun opérateur n'est appelé.
- Une vente en MoMo ou Orange Money est enregistrée comme payée. Rien n'est
  débité, aucune référence d'opérateur n'est inventée au-delà d'un repère de
  démonstration.
- Les montants, les articles et les numéros du jeu de démonstration sont fictifs.

## Architecture

```
kolo-boutique/
  backend/    FastAPI + SQLAlchemy 2 + SQLite   (api, dictée, coût moyen, tendance, feuilles)
  frontend/   Next.js 16 App Router + CSS propre (journée, dictée, rayon, ventes, tiroir, réglages)
```

L'interface ne parle qu'à l'API, par la réécriture `/api/*`. Le calcul du coût
moyen, le bénéfice figé à la vente, la phrase comprise et les libellés de
montant vivent dans `backend/app/services/` ; le comptoir les affiche tels
quels. Voir `backend/README.md` et `frontend/README.md`.

## Vérifications

```bash
cd backend && pytest -q         # 12 tests : séance, dictée, stock, bénéfice, rayure, comptage, CSV, rail coupé
cd frontend && npm run lint && npm run build
```

Les deux sont passées le 5 novembre 2026 sur le poste, avec un Node 24.22.2 et
un CPython 3.12.10 portables installés hors dépôt (dans `~/tools`). L'API a
tourné sur 8300, l'interface sur 3400, la séance s'est ouverte pour de vrai et
les six écrans du comptoir ont été lus avec la base de démonstration. La revue
visuelle reste à faire : le navigateur de test n'exposait pas de surface
affichable, donc les mesures ont été prises sur le DOM.
