from app.utils import aujourdhui
from datetime import date


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-wear"
    assert corps["langues"] == ["fr", "en"]


def test_login_et_droits(responsable, agent):
    assert responsable.get("/organisation").status_code == 200
    assert agent.get("/etat").status_code == 200


def test_article_parcours(responsable):
    reponse = responsable.post(
        "/articles",
        json={
            "nom": "Robe test wax",
            "categorie": "robe",
            "taille": "M",
            "couleur": "bleu",
            "stock": 4,
            "prix_achat": 9000,
            "prix_vente": 20000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    article = reponse.json()
    assert article["reference"].startswith("PT-")
    assert article["statut"] == "en_stock"

    # La vente exige une cliente.
    reponse = responsable.patch(f"/articles/{article['id']}", json={"statut": "vendu"})
    assert reponse.status_code == 422

    cliente = responsable.post("/clients", json={"nom": "Cliente Test", "telephone": "677123456", "type": "particulier"})
    assert cliente.status_code == 200, cliente.text
    cliente_id = cliente.json()["id"]
    assert cliente.json()["telephone"].startswith("+237")

    reponse = responsable.patch(
        f"/articles/{article['id']}",
        json={"statut": "vendu", "quantite_vendue": 2, "client_id": cliente_id},
    )
    assert reponse.status_code == 200, reponse.text
    corps = reponse.json()
    assert corps["stock"] == 2
    assert corps["quantite_vendue"] == 2
    assert corps["client"] == "Cliente Test"
    assert corps["date_vente"]

    # Une vente supérieure au stock est refusée.
    reponse = responsable.patch(
        f"/articles/{article['id']}",
        json={"statut": "vendu", "quantite_vendue": 9, "client_id": cliente_id},
    )
    assert reponse.status_code == 422


def test_catalogue_public(agent):
    reponse = agent.get("/public/catalogue")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["boutique"]["nom"]
    assert all(un["statut"] == "en_stock" for un in corps["articles"])
    assert all("client" not in un for un in corps["articles"])
    assert all("prix_achat" not in un for un in corps["articles"])


def test_recette_et_exports(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    etat = reponse.json()
    assert etat["articles"] >= 12
    assert etat["clients"] >= 10

    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    recap = reponse.json()
    assert recap["periode"] == aujourdhui().strftime("%Y-%m")
    assert "par_categorie" in recap

    for nom in ("articles.csv", "clients.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200, nom
        assert "text/csv" in reponse.headers["content-type"]


def test_validation_bilingue(responsable):
    reponse = responsable.post("/articles", json={"nom": "X", "categorie": "chapeau", "taille": "XXXL"})
    assert reponse.status_code == 422
    corps = reponse.json()
    assert "code" in corps
    assert "fr" in corps and "en" in corps


def test_demande_publique(responsable, app_client):
    catalogue = app_client.get("/public/catalogue").json()
    article = catalogue["articles"][0]
    reponse = app_client.post(
        "/public/demandes",
        json={
            "article_id": article["id"],
            "client_nom": "Aïcha Mbarga",
            "client_telephone": "6 90 12 34 56",
            "note": "taille M, couleur rouge",
        },
    )
    assert reponse.status_code == 200
    assert reponse.json()["ok"] is True
    assert reponse.json()["statut"] == "demande"

    liste = responsable.get("/demandes").json()
    assert liste["total"] == 1
    assert liste["demandes"][0]["client_telephone"] == "+237690123456"

    demande_id = liste["demandes"][0]["id"]
    reponse = responsable.post(f"/demandes/{demande_id}", json={"statut": "confirmee"})
    assert reponse.status_code == 200
    assert reponse.json()["statut"] == "confirmee"
    assert responsable.get("/demandes?statut=confirmee").json()["total"] == 1


def test_demande_publique_invalides(app_client):
    reponse = app_client.post(
        "/public/demandes",
        json={"client_nom": "A", "client_telephone": "12"},
    )
    assert reponse.status_code == 422
