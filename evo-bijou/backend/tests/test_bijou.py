"""La vitrine : pièces, clients, vente, catalogue public."""

from app.utils import aujourdhui
from datetime import date


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200


def test_piece_et_cycle(responsable):
    reponse = responsable.post(
        "/pieces",
        json={
            "nom": "Bague Test Unique",
            "matiere": "or",
            "poids_grammes": 3.5,
            "carat": 18,
            "prix_achat": 500000,
            "prix_vente": 750000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    piece = reponse.json()
    assert piece["statut"] == "en_vitrine"
    assert piece["reference"].startswith("BJ-")
    piece_id = piece["id"]

    # Sans client, la vente est refusée.
    refuse = responsable.patch(f"/pieces/{piece_id}", json={"statut": "vendu"})
    assert refuse.status_code == 422

    # Avec un client, la vente passe et porte la date.
    clients = responsable.get("/clients").json()["clients"]
    client_id = clients[0]["id"]
    vendu = responsable.patch(
        f"/pieces/{piece_id}",
        json={"statut": "vendu", "client_id": client_id},
    )
    assert vendu.status_code == 200, vendu.text
    assert vendu.json()["statut"] == "vendu"
    assert vendu.json()["client"] == clients[0]["nom"]
    assert vendu.json()["date_vente"] == aujourdhui().isoformat()

    # Le retour en vitrine efface la vente.
    reliste = responsable.patch(f"/pieces/{piece_id}", json={"statut": "en_vitrine"})
    assert reliste.status_code == 200
    assert reliste.json()["client_id"] is None
    assert reliste.json()["date_vente"] is None


def test_champs_invalides(responsable):
    reponse = responsable.post(
        "/pieces",
        json={"nom": "X", "matiere": "diamant", "carat": 99},
    )
    assert reponse.status_code == 422


def test_client_telephone(responsable):
    reponse = responsable.post(
        "/clients",
        json={"nom": "Client Tel Test", "telephone": "677 12 34 56", "type": "particulier"},
    )
    assert reponse.status_code == 200
    assert reponse.json()["telephone"] == "+237677123456"
    assert reponse.json()["telephone_joignable"] is True

    refuse = responsable.post("/clients", json={"nom": "Client Mauvais", "telephone": "123", "type": "particulier"})
    assert refuse.status_code == 422

    refuse_type = responsable.post("/clients", json={"nom": "Client Type", "type": "vip"})
    assert refuse_type.status_code == 422


def test_recherche_et_filtres(responsable):
    responsable.post(
        "/pieces",
        json={"nom": "Collier Recherche Test", "matiere": "argent", "prix_vente": 200000},
    )
    reponse = responsable.get("/pieces?recherche=collier recherche test")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["total"] >= 1
    assert all("collier recherche test" in un["nom"].lower() for un in corps["pieces"])

    par_statut = responsable.get("/pieces?statut=en_vitrine").json()
    assert all(un["statut"] == "en_vitrine" for un in par_statut["pieces"])
    par_matiere = responsable.get("/pieces?matiere=or").json()
    assert all(un["matiere"] == "or" for un in par_matiere["pieces"])


def test_agent_voit_tout(agent):
    etat = agent.get("/etat")
    assert etat.status_code == 200
    assert etat.json()["pieces"] > 0


def test_comptes_reserve(responsable, agent):
    refuse = agent.post("/comptes", json={"nom": "Test", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"})
    assert refuse.status_code == 403
    nouveau = responsable.post(
        "/comptes",
        json={"nom": "Nouveau Agent", "email": "nouveau@bijou.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert nouveau.status_code == 200
    assert nouveau.json()["role"] == "agent"
    dup = responsable.post(
        "/comptes",
        json={"nom": "Encore", "email": "nouveau@bijou.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert dup.status_code in (409, 422)


def test_recap(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["pieces"] >= 15
    assert "par_matiere" in corps
    assert corps["valeur_stock"] > 0


def test_recap_periode_inconnue(responsable):
    assert responsable.get("/recap?periode=2025-13").status_code == 422


def test_catalogue_public(client):
    reponse = client.get("/public/catalogue")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["bijouterie"]["nom"]
    assert len(corps["pieces"]) > 0
    assert all(un["statut"] == "en_vitrine" for un in corps["pieces"])
    # Le catalogue ne fuit ni client ni prix d'achat.
    assert all("prix_achat" not in un for un in corps["pieces"])
    assert all(un.get("client", "") == "" for un in corps["pieces"])


def test_exports(responsable):
    for nom in ("pieces.csv", "clients.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
