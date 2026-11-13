"""La séance, l'école et son année de démonstration."""

CAISSE = {"email": "caisse@tilleuls.cm", "password": "Caisse2026!"}
DIRECTION = {"email": "direction@tilleuls.cm", "password": "Caisse2026!"}


def lire(reponse, attendu=200):
    assert reponse.status_code == attendu, reponse.text
    return reponse.json()


def test_sante_parle_de_simulation(client):
    data = lire(client.get("/health"))
    assert data["status"] == "ok"
    assert data["demo"] is True
    assert "opérateur" in data["envoi"]


def test_seance_sinstalle_puis_se_ferme(client):
    refus = client.post(
        "/auth/login", json={"email": CAISSE["email"], "password": "mauvais"}
    )
    assert refus.status_code == 401

    entree = client.post("/auth/login", json=CAISSE)
    data = lire(entree)
    assert data["user"]["role"] == "comptable"
    assert data["ecole"]["nom"] == "Groupe Scolaire Les Tilleuls"
    assert "cash_session" in entree.headers.get("set-cookie", "")

    moi = lire(client.get("/auth/me"))
    assert moi["ecole"]["quartier"] == "Bonapriso"
    assert moi["annee"].count("/") == 1

    assert client.post("/auth/logout").status_code == 204
    assert client.get("/auth/me").status_code == 401


def test_la_directrice_est_une_autre_main_de_la_meme_maison(client):
    lire(client.post("/auth/login", json=DIRECTION))
    equipe = lire(client.get("/team"))
    roles = {membre["role"] for membre in equipe}
    assert {"directrice", "comptable"} <= roles
    assert len(equipe) == 2


def test_le_dashboard_tient_la_caisse_du_jour(signed_in):
    bord = lire(signed_in.get("/dashboard"))
    assert bord["ecole"]["abonnement_label"].endswith("FCFA")
    assert bord["effectif"] >= 40
    assert bord["recouvrement"]["attendu"] > bord["recouvrement"]["rentre"]
    assert 0 <= bord["recouvrement"]["part"] <= 100
    assert bord["caisse"]["total"] >= 0
    assert len(bord["serie"]) == 7
    assert bord["classes"]
    for classe in bord["classes"]:
        assert classe["effectif"] > 0
        assert classe["part"] <= 100
    assert bord["en_retard"] > 0, "la démo doit montrer des familles en retard"
    assert bord["fiches_en_retard"], "les retards doivent être nommés"
    assert bord["derniers_recus"], "des reçus doivent avoir été remis"
    assert bord["prochaines_echeances"]


def test_les_reglages_portent_lecole_et_les_compteurs(signed_in):
    reglages = lire(signed_in.get("/settings"))
    assert reglages["devise"] == "FCFA"
    assert reglages["demo"] is True
    assert reglages["compteurs"]["eleves"] >= 40
    assert reglages["compteurs"]["recus"] >= 10
    assert reglages["ecole"]["whatsapp_actif"] is True
    assert reglages["ecole"]["telephone_display"].startswith("2 ")
    assert len(reglages["classes"]) >= 6
