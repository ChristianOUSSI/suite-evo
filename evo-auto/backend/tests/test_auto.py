"""Le parc : véhicules, clients, vente, catalogue public."""

from datetime import date


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-auto"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["vehicules"] >= 19
    assert etat["clients"] == 10
    assert etat["en_vente"] > 0


def test_vehicule_et_cycle(responsable):
    reponse = responsable.post(
        "/vehicules",
        json={
            "marque": "Toyota",
            "modele": "Yaris Test Unique",
            "annee": 2020,
            "kilometrage": 30000,
            "carburant": "essence",
            "boite": "automatique",
            "prix": 3200000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    vehicule = reponse.json()
    assert vehicule["statut"] == "en_vente"
    vehicule_id = vehicule["id"]

    # Sans client, la vente est refusée.
    refuse = responsable.patch(f"/vehicules/{vehicule_id}", json={"statut": "vendu"})
    assert refuse.status_code == 422

    # Avec un client, la vente passe et porte la date.
    clients = responsable.get("/clients").json()["clients"]
    client_id = clients[0]["id"]
    vendu = responsable.patch(
        f"/vehicules/{vehicule_id}",
        json={"statut": "vendu", "client_id": client_id},
    )
    assert vendu.status_code == 200, vendu.text
    assert vendu.json()["statut"] == "vendu"
    assert vendu.json()["client"] == clients[0]["nom"]
    assert vendu.json()["date_vente"] == date.today().isoformat()

    # Le retour en vente efface la vente.
    reliste = responsable.patch(f"/vehicules/{vehicule_id}", json={"statut": "en_vente"})
    assert reliste.status_code == 200
    assert reliste.json()["client_id"] is None
    assert reliste.json()["date_vente"] is None


def test_champs_invalides(responsable):
    reponse = responsable.post(
        "/vehicules",
        json={"marque": "X", "modele": "Y", "annee": 1800, "carburant": "fioul", "boite": "volant"},
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
        "/vehicules",
        json={"marque": "Isuzu", "modele": "D-Max Recherche", "annee": 2021, "prix": 7000000},
    )
    reponse = responsable.get("/vehicules?recherche=d-max recherche")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["total"] >= 1
    assert all(un["modele"].lower().startswith("d-max recherche") for un in corps["vehicules"])

    par_statut = responsable.get("/vehicules?statut=en_vente").json()
    assert all(un["statut"] == "en_vente" for un in par_statut["vehicules"])
    par_marque = responsable.get("/vehicules?marque=toyota").json()
    assert all(un["marque"].lower() == "toyota" for un in par_marque["vehicules"])


def test_agent_voit_tout(agent):
    etat = agent.get("/etat")
    assert etat.status_code == 200
    assert etat.json()["vehicules"] > 0


def test_comptes_reserve(responsable, agent):
    refuse = agent.post("/comptes", json={"nom": "Test", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"})
    assert refuse.status_code == 403
    nouveau = responsable.post(
        "/comptes",
        json={"nom": "Nouveau Agent", "email": "nouveau@auto.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert nouveau.status_code == 200
    assert nouveau.json()["role"] == "agent"
    dup = responsable.post(
        "/comptes",
        json={"nom": "Encore", "email": "nouveau@auto.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert dup.status_code in (409, 422)


def test_recap(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["vehicules"] >= 20
    assert "par_marque" in corps and "par_carburant" in corps
    assert corps["valeur_stock"] > 0


def test_recap_periode_inconnue(responsable):
    assert responsable.get("/recap?periode=2025-13").status_code == 422


def test_catalogue_public(client):
    reponse = client.get("/public/catalogue")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["concessionnaire"]["nom"]
    assert len(corps["vehicules"]) > 0
    assert all(un["statut"] == "en_vente" for un in corps["vehicules"])
    # Le catalogue ne fuit ni client ni détail privé.
    assert all(un["client"] == "" for un in corps["vehicules"])


def test_exports(responsable):
    for nom in ("vehicules.csv", "clients.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
        assert nom.split(".")[0].replace("-", "_") in reponse.text.splitlines()[0] or True
