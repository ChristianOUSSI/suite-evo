from app.utils import aujourdhui
from datetime import date


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-cars"
    assert corps["langues"] == ["fr", "en"]


def test_login_et_droits(responsable, agent):
    assert responsable.get("/organisation").status_code == 200
    assert agent.get("/etat").status_code == 200


def test_voiture_parcours(responsable):
    reponse = responsable.post(
        "/voitures",
        json={
            "marque": "Toyota",
            "modele": "Land Cruiser",
            "annee": 2020,
            "kilometrage": 30000,
            "carburant": "diesel",
            "boite": "automatique",
            "prix": 85000000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    voiture = reponse.json()
    assert voiture["statut"] == "en_vente"

    # La vente exige un client.
    reponse = responsable.patch(f"/voitures/{voiture['id']}", json={"statut": "vendu"})
    assert reponse.status_code == 422

    client = responsable.post("/clients", json={"nom": "Acheteur Test", "telephone": "677123456"})
    assert client.status_code == 200, client.text
    client_id = client.json()["id"]
    assert client.json()["telephone"].startswith("+237")

    reponse = responsable.patch(
        f"/voitures/{voiture['id']}",
        json={"statut": "vendu", "client_id": client_id},
    )
    assert reponse.status_code == 200, reponse.text
    assert reponse.json()["statut"] == "vendu"
    assert reponse.json()["date_vente"]

    # Le retour en vente efface client et date.
    reponse = responsable.patch(f"/voitures/{voiture['id']}", json={"statut": "en_vente"})
    assert reponse.status_code == 200
    assert reponse.json()["client_id"] is None


def test_piece_stock_et_vente(responsable):
    reponse = responsable.post(
        "/pieces",
        json={
            "designation": "Filtre à huile test",
            "compatibilite": "Toyota Hilux",
            "stock": 5,
            "prix_achat": 4000,
            "prix_vente": 8000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    piece = reponse.json()
    assert piece["reference"].startswith("PC-")
    assert piece["statut"] == "en_stock"

    # Une vente supérieure au stock est refusée.
    reponse = responsable.patch(
        f"/pieces/{piece['id']}",
        json={"statut": "vendu", "quantite_vendue": 9},
    )
    assert reponse.status_code == 422

    client = responsable.post("/clients", json={"nom": "Garage Partenaire", "type": "garage"})
    client_id = client.json()["id"]

    reponse = responsable.patch(
        f"/pieces/{piece['id']}",
        json={"statut": "vendu", "quantite_vendue": 3, "client_id": client_id},
    )
    assert reponse.status_code == 200, reponse.text
    corps = reponse.json()
    assert corps["stock"] == 2
    assert corps["quantite_vendue"] == 3
    assert corps["client"] == "Garage Partenaire"

    # Le réassort remonte le stock sans effacer la vente.
    reponse = responsable.patch(f"/pieces/{piece['id']}", json={"stock": 10})
    assert reponse.status_code == 200
    assert reponse.json()["stock"] == 10


def test_catalogue_public(agent):
    reponse = agent.get("/public/catalogue")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["garage"]["nom"]
    assert all(un["statut"] == "en_vente" for un in corps["voitures"])
    assert all("client" not in un for un in corps["voitures"])
    assert all(un["statut"] == "en_stock" for un in corps["pieces"])
    assert all("prix_achat" not in un for un in corps["pieces"])


def test_recette_et_exports(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    etat = reponse.json()
    assert etat["voitures"] >= 15
    assert etat["pieces"] >= 10

    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    recap = reponse.json()
    assert recap["periode"] == aujourdhui().strftime("%Y-%m")
    assert "par_marque" in recap

    for nom in ("voitures.csv", "pieces.csv", "clients.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200, nom
        assert "text/csv" in reponse.headers["content-type"]


def test_validation_bilingue(responsable):
    reponse = responsable.post("/voitures", json={"marque": "X", "modele": "", "annee": 1800})
    assert reponse.status_code == 422
    corps = reponse.json()
    assert "code" in corps
    assert "fr" in corps and "en" in corps


def test_demande_publique(agent):
    """Le client demande une voiture ou une pièce, sans compte."""
    from fastapi.testclient import TestClient

    from app.main import app

    catalogue = TestClient(app).get("/public/catalogue").json()
    assert catalogue["voitures"] or catalogue["pieces"], "la démo doit montrer le parc"

    reponse = TestClient(app).post(
        "/public/demandes",
        json={
            "type": "voiture",
            "voiture_id": catalogue["voitures"][0]["id"] if catalogue["voitures"] else None,
            "client_nom": "Client Test",
            "client_telephone": "690 12 34 56",
            "note": "Test drive Saturday",
        },
    )
    assert reponse.status_code == 201, reponse.text
    corps = reponse.json()
    assert corps["ok"] and corps["statut"] == "demande"

    liste = agent.get("/demandes").json()
    demande = next(d for d in liste["demandes"] if d["id"] == corps["id"])
    assert demande["type"] == "voiture"
    assert demande["client_telephone"].startswith("+237")
