"""L'atelier : motos, clients, réparations, catalogue public."""

from datetime import date


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200


def test_moto_et_cycle(responsable):
    reponse = responsable.post(
        "/motos",
        json={
            "marque": "Yamaha",
            "modele": "FZ Test Unique",
            "annee": 2020,
            "kilometrage": 30000,
            "couleur": "Rouge",
            "prix": 1200000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    moto = reponse.json()
    assert moto["statut"] == "en_vente"
    moto_id = moto["id"]

    refuse = responsable.patch(f"/motos/{moto_id}", json={"statut": "vendu"})
    assert refuse.status_code == 422

    clients = responsable.get("/clients").json()["clients"]
    client_id = clients[0]["id"]
    vendu = responsable.patch(
        f"/motos/{moto_id}",
        json={"statut": "vendu", "client_id": client_id},
    )
    assert vendu.status_code == 200, vendu.text
    assert vendu.json()["statut"] == "vendu"
    assert vendu.json()["client"] == clients[0]["nom"]
    assert vendu.json()["date_vente"] == date.today().isoformat()

    reliste = responsable.patch(f"/motos/{moto_id}", json={"statut": "en_vente"})
    assert reliste.status_code == 200
    assert reliste.json()["client_id"] is None
    assert reliste.json()["date_vente"] is None


def test_reparation_cycle(responsable):
    clients = responsable.get("/clients").json()["clients"]
    reponse = responsable.post(
        "/reparations",
        json={
            "client_id": clients[0]["id"],
            "panne": "Panne test unique",
            "travaux": "Réglage complet",
            "cout_main_oeuvre": 15000,
            "cout_pieces": 5000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    rep = reponse.json()
    assert rep["statut"] == "recue"
    assert rep["cout_total"] == 20000
    rep_id = rep["id"]

    cours = responsable.patch(f"/reparations/{rep_id}", json={"statut": "en_cours"})
    assert cours.status_code == 200
    assert cours.json()["statut"] == "en_cours"

    terminee = responsable.patch(f"/reparations/{rep_id}", json={"statut": "terminee"})
    assert terminee.status_code == 200

    livree = responsable.patch(f"/reparations/{rep_id}", json={"statut": "livree"})
    assert livree.status_code == 200
    assert livree.json()["statut"] == "livree"
    assert livree.json()["date_livraison"] == date.today().isoformat()


def test_reparation_client_inconnu(responsable):
    reponse = responsable.post(
        "/reparations",
        json={"client_id": 99999, "panne": "Test"},
    )
    assert reponse.status_code == 404


def test_client_telephone(responsable):
    reponse = responsable.post(
        "/clients",
        json={"nom": "Client Tel Test", "telephone": "677 12 34 56", "type": "livreur"},
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
        "/motos",
        json={"marque": "Bajaj", "modele": "Dominar Recherche", "annee": 2021, "prix": 3000000},
    )
    reponse = responsable.get("/motos?recherche=dominar recherche")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["total"] >= 1
    assert all("dominar recherche" in un["modele"].lower() for un in corps["motos"])

    par_statut = responsable.get("/motos?statut=en_vente").json()
    assert all(un["statut"] == "en_vente" for un in par_statut["motos"])
    par_marque = responsable.get("/motos?marque=bajaj").json()
    assert all(un["marque"].lower() == "bajaj" for un in par_marque["motos"])


def test_agent_voit_tout(agent):
    etat = agent.get("/etat")
    assert etat.status_code == 200
    assert etat.json()["motos"] > 0
    assert etat.json()["reparations"] > 0


def test_comptes_reserve(responsable, agent):
    refuse = agent.post("/comptes", json={"nom": "Test", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"})
    assert refuse.status_code == 403
    nouveau = responsable.post(
        "/comptes",
        json={"nom": "Nouveau Agent", "email": "nouveau@moto.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert nouveau.status_code == 200
    assert nouveau.json()["role"] == "agent"
    dup = responsable.post(
        "/comptes",
        json={"nom": "Encore", "email": "nouveau@moto.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert dup.status_code in (409, 422)


def test_recap(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["motos"] >= 15
    assert corps["reparations"] >= 10
    assert "par_marque" in corps and "par_statut_rep" in corps
    assert corps["valeur_stock"] > 0


def test_recap_periode_inconnue(responsable):
    assert responsable.get("/recap?periode=2025-13").status_code == 422


def test_catalogue_public(client):
    reponse = client.get("/public/catalogue")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["garage"]["nom"]
    assert len(corps["motos"]) > 0
    assert all(un["statut"] == "en_vente" for un in corps["motos"])
    assert all(un.get("client", "") == "" or "client" not in un for un in corps["motos"])


def test_exports(responsable):
    for nom in ("motos.csv", "clients.csv", "reparations.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
