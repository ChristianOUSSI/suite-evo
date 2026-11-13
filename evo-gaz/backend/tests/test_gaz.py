def test_seance_et_permissions(client, responsable, agent):
    reponse = client.get("/auth/me")
    assert reponse.status_code == 401

    reponse = responsable.get("/auth/me")
    assert reponse.status_code == 200
    assert reponse.json()["user"]["role"] == "responsable"

    reponse = client.post(
        "/comptes",
        json={"nom": "Test", "email": "test@depotgaz.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 401

    reponse = agent.post(
        "/comptes",
        json={"nom": "Test", "email": "test@depotgaz.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 403
    assert reponse.json()["detail"]["code"] == "droits"

    reponse = responsable.post(
        "/comptes",
        json={"nom": "Test", "email": "test@depotgaz.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 200

    reponse = responsable.post("/comptes", json={
        "nom": "Doublon", "email": "test@depotgaz.cm", "mot_de_passe": "Test1234!", "role": "agent"})
    assert reponse.status_code == 409


def test_parcours_livraison(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    etat = reponse.json()
    assert etat["livraisons"] >= 20
    assert etat["clients"] >= 10

    reponse = responsable.post(
        "/clients",
        json={"nom": "Mama Test", "telephone": "+237677998877", "quartier": "Akwa", "type": "particulier"},
    )
    assert reponse.status_code == 200
    client = reponse.json()

    reponse = responsable.post(
        "/livraisons",
        json={"client_id": client["id"], "quantite": 3, "prix_unitaire": 6800, "adresse": "Akwa", "note": "bonbonnes"},
    )
    assert reponse.status_code == 200
    livraison = reponse.json()
    assert livraison["statut"] == "commandee"
    assert livraison["montant"] == 20400

    for statut in ("en_route", "livree"):
        reponse = responsable.patch(
            f"/livraisons/{livraison['id']}", json={"statut": statut}
        )
        assert reponse.status_code == 200
        assert reponse.json()["statut"] == statut

    assert reponse.json()["date_livraison"] is not None

    reponse = responsable.patch(f"/livraisons/{livraison['id']}", json={"statut": "commandee"})
    assert reponse.json()["date_livraison"] is None


def test_livraison_inconnue(responsable):
    reponse = responsable.patch("/livraisons/99999", json={"statut": "livree"})
    assert reponse.status_code == 404
    assert reponse.json()["detail"]["code"] == "livraison_inconnue"


def test_client_quartier_et_type(responsable):
    clients = responsable.get("/clients").json()["clients"]
    cible = clients[0]["id"]
    reponse = responsable.patch(f"/clients/{cible}", json={"quartier": "Nouveau Q", "type": "restaurant"})
    assert reponse.status_code == 200
    assert reponse.json()["quartier"] == "Nouveau Q"
    assert reponse.json()["type"] == "restaurant"

    reponse = responsable.patch(f"/clients/{cible}", json={"type": "inconnu"})
    assert reponse.status_code == 422


def test_recap_et_periode(responsable):
    reponse = responsable.get("/recap?periode=2026-10")
    assert reponse.status_code == 200
    recap = reponse.json()
    assert recap["periode"] == "2026-10"
    assert "par_quartier" in recap
    assert "par_type" in recap
    assert recap["livrees_mois"] >= 0

    reponse = responsable.get("/recap?periode=mauvaise")
    assert reponse.status_code == 422
    assert reponse.json()["detail"]["code"] == "periode_inconnue"


def test_exports_csv(responsable):
    for chemin in ("/exports/livraisons.csv", "/exports/clients.csv"):
        reponse = responsable.get(chemin)
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        contenu = reponse.content.decode("utf-8-sig")
        assert ";" in contenu.split("\n")[0]


def test_commande_publique(client):
    """La page publique commande sans compte : le client naît du numéro."""
    reponse = client.post(
        "/public/commandes",
        json={"nom": "Client Public", "telephone": "+237677554433", "quartier": "Bonanjo", "quantite": 2},
    )
    assert reponse.status_code == 201
    assert reponse.json()["ok"] is True

    # Deuxième commande du même numéro : le client est retrouvé, pas dupliqué.
    reponse = client.post(
        "/public/commandes",
        json={"nom": "Client Public", "telephone": "+237677554433", "quartier": "Bonanjo", "quantite": 1},
    )
    assert reponse.status_code == 201

    # Numéro hors format camerounais refusé.
    reponse = client.post(
        "/public/commandes",
        json={"nom": "X", "telephone": "1234", "quartier": "", "quantite": 1},
    )
    assert reponse.status_code == 422


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["status"] == "ok"
    assert "gaz" in corps.get("service", "")


def test_filtrage_livraisons(responsable):
    reponse = responsable.get("/livraisons?statut=livree")
    assert reponse.status_code == 200
    lignes = reponse.json()["livraisons"]
    assert all(un["statut"] == "livree" for un in lignes)

    reponse = responsable.get("/livraisons?recherche=bonanjo")
    assert reponse.status_code == 200
    assert reponse.json()["total"] >= 0


def test_validation_bilingue(responsable):
    """Une validation sans nom de champ technique : messages propres FR/EN."""
    reponse = responsable.post("/clients", json={"nom": "X"})
    assert reponse.status_code == 422
    corps = reponse.json()
    assert "fr" in corps and "en" in corps
