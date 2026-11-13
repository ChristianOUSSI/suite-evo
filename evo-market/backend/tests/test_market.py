"""La boutique : annonces, commandes, stock, page publique."""


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-market"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["annonces"] > 30
    assert etat["en_ligne"] > 0


def test_annonce_et_statut(responsable, annonce_test):
    assert annonce_test["statut"] == "en_ligne"
    assert annonce_test["prix"] == 25000
    assert annonce_test["stock"] == 5

    corrige = responsable.patch(
        f"/annonces/{annonce_test['id']}", json={"statut": "vendu"}
    )
    assert corrige.status_code == 200
    assert corrige.json()["statut"] == "vendu"

    refus = responsable.patch(f"/annonces/{annonce_test['id']}", json={"statut": "inconnu"})
    assert refus.status_code == 422


def test_commande_et_stock(agent, annonce_test):
    # Une annonce vendue ne se commande plus.
    agent.patch(f"/annonces/{annonce_test['id']}", json={"statut": "en_ligne"})

    reponse = agent.post(
        "/commandes",
        json={
            "annonce_id": annonce_test["id"],
            "quantite": 2,
            "acheteur_nom": "Nathalie Test",
            "acheteur_telephone": "655667788",
            "moyen": "mtn_money",
        },
    )
    assert reponse.status_code == 200, reponse.text
    commande = reponse.json()
    assert commande["statut"] == "nouvelle"
    assert commande["montant"] == 50000  # prix figé au moment de la vente
    assert commande["annonce"] == annonce_test["titre"]

    # Confirmer descend le stock de 2.
    confirmee = agent.patch(f"/commandes/{commande['id']}", json={"statut": "confirmee"})
    assert confirmee.status_code == 200
    fiche = agent.get(f"/annonces/{annonce_test['id']}").json()
    assert fiche["stock"] == 3

    # Annuler la confirmation rend le stock.
    agent.patch(f"/commandes/{commande['id']}", json={"statut": "annulee"})
    fiche = agent.get(f"/annonces/{annonce_test['id']}").json()
    assert fiche["stock"] == 5


def test_commande_sans_stock(agent, responsable, annonce_test):
    agent.patch(f"/annonces/{annonce_test['id']}", json={"stock": 1})
    reponse = agent.post(
        "/commandes",
        json={"annonce_id": annonce_test["id"], "quantite": 5, "acheteur_nom": "X Y"},
    )
    assert reponse.status_code == 409


def test_annonces_publiques_sans_compte(client, annonce_test, agent):
    client.cookies.clear()
    agent.patch(f"/annonces/{annonce_test['id']}", json={"statut": "en_ligne", "stock": 2})
    reponse = client.get("/public/annonces")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["boutique"]["nom"]
    titres = [un["id"] for un in corps["annonces"]]
    assert annonce_test["id"] in titres
    # La page publique ne montre ni vendeur ni commandes.
    annonce = next(un for un in corps["annonces"] if un["id"] == annonce_test["id"])
    assert "vendeur_nom" not in annonce
    assert "commandes" not in annonce


def test_recap_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["periode"]
    assert "par_categorie" in corps
    assert "par_statut" in corps


def test_export_csv(responsable):
    for nom in ("annonces.csv", "commandes.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        assert reponse.text.splitlines()


def test_agent_fait_le_quotidien_mais_pas_les_comptes(agent, responsable):
    assert agent.post("/comptes", json={"nom": "X Y", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"}).status_code == 403
    assert agent.put("/organisation", json={"nom": "Autre Boutique"}).status_code == 403
