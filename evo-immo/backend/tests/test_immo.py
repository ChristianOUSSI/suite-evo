"""Le registre de l'agence : biens, demandes, visites, annonces publiques."""


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-immo"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["biens"] > 20
    assert etat["disponibles"] > 0
    assert etat["demandes_mois"] >= 0


def test_bien_et_statut(responsable, bien_test):
    assert bien_test["statut"] == "disponible"
    assert bien_test["prix"] == 12_000_000
    assert bien_test["agent"]

    corrige = responsable.patch(
        f"/biens/{bien_test['id']}", json={"statut": "negociation"}
    )
    assert corrige.status_code == 200
    assert corrige.json()["statut"] == "negociation"

    refus = responsable.patch(f"/biens/{bien_test['id']}", json={"statut": "inconnu"})
    assert refus.status_code == 422


def test_demande_et_canaux(responsable, bien_test):
    reponse = responsable.post(
        "/demandes",
        json={
            "bien_id": bien_test["id"],
            "client_nom": "Nathalie Test",
            "client_telephone": "+237655667788",
            "canal": "whatsapp",
            "message": "Disponible ce week-end ?",
        },
    )
    assert reponse.status_code == 200, reponse.text
    demande = reponse.json()
    assert demande["statut"] == "nouvelle"
    assert demande["canal"] == "whatsapp"
    assert demande["bien"] == bien_test["titre"]

    # Le statut avance : nouvelle → contactée → visite → convertie.
    for statut in ("contactee", "visite", "convertie"):
        reponse = responsable.patch(f"/demandes/{demande['id']}", json={"statut": statut})
        assert reponse.status_code == 200
        assert reponse.json()["statut"] == statut


def test_visite_et_issue(responsable, agent, bien_test):
    reponse = agent.post(
        "/visites",
        json={
            "bien_id": bien_test["id"],
            "heure": "14:30",
            "client_nom": "Serge Test",
            "client_telephone": "+237699112233",
        },
    )
    assert reponse.status_code == 200, reponse.text
    visite = reponse.json()
    assert visite["issue"] == "a_venir"
    assert visite["date"]

    finie = responsable.patch(f"/visites/{visite['id']}", json={"issue": "ok", "note": "couple séduit"})
    assert finie.status_code == 200
    assert finie.json()["issue"] == "ok"


def test_visite_heure_invalide(responsable, bien_test):
    reponse = responsable.post(
        "/visites",
        json={"bien_id": bien_test["id"], "heure": "25:99"},
    )
    assert reponse.status_code == 422


def test_annonces_publiques_sans_compte(client, responsable, bien_test):
    client.cookies.clear()
    reponse = client.get("/public/annonces")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["agence"]["nom"]
    titres = [un["id"] for un in corps["annonces"]]
    assert bien_test["id"] in titres
    # La page publique ne montre ni propriétaire ni demandes.
    annonce = next(un for un in corps["annonces"] if un["id"] == bien_test["id"])
    assert "proprietaire_nom" not in annonce
    assert "demandes" not in annonce

    # Un bien retiré disparaît des annonces.
    responsable.patch(f"/biens/{bien_test['id']}", json={"statut": "retire"})
    apres = client.get("/public/annonces").json()
    assert bien_test["id"] not in [un["id"] for un in apres["annonces"]]


def test_agent_fait_le_quotidien_mais_pas_les_comptes(agent, responsable):
    assert agent.post("/comptes", json={"nom": "X Y", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"}).status_code == 403
    assert agent.put("/organisation", json={"nom": "Autre Agence"}).status_code == 403


def test_recap_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["periode"]
    assert "par_issue" in corps
    assert "par_type" in corps
    assert "par_quartier" in corps


def test_export_csv(responsable):
    for nom in ("biens.csv", "demandes.csv", "visites.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        assert reponse.text.splitlines()


def test_demande_depuis_annonce(agent):
    """Le prospect écrit depuis la page des annonces, sans compte."""
    from fastapi.testclient import TestClient

    from app.main import app

    # Une annonce publique pour viser un bien précis.
    annonces = TestClient(app).get("/public/annonces").json()["annonces"]
    assert annonces, "la démo doit publier des biens"
    bien = annonces[0]

    reponse = TestClient(app).post(
        "/public/demandes",
        json={
            "bien_id": bien["id"],
            "nom": "Prospect Test",
            "telephone": "690 12 34 56",
            "message": "Disponible samedi ?",
        },
    )
    assert reponse.status_code == 201, reponse.text
    corps = reponse.json()
    assert corps["ok"] and corps["statut"] == "nouvelle"

    liste = agent.get("/demandes").json()
    demande = next(d for d in liste["demandes"] if d["id"] == corps["id"])
    assert demande["canal"] == "annonce"
    assert demande["client_telephone"].startswith("+237")
