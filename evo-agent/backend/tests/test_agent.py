def test_seance_et_permissions(client, responsable, agent):
    reponse = client.get("/auth/me")
    assert reponse.status_code == 401

    reponse = responsable.get("/auth/me")
    assert reponse.status_code == 200
    assert reponse.json()["user"]["role"] == "responsable"

    reponse = client.post(
        "/comptes",
        json={"nom": "Test", "email": "test@agence.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 401

    reponse = agent.post(
        "/comptes",
        json={"nom": "Test", "email": "test@agence.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 403
    assert reponse.json()["detail"]["code"] == "droits"

    reponse = responsable.post(
        "/comptes",
        json={"nom": "Test", "email": "test@agence.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 200

    reponse = responsable.post("/comptes", json={
        "nom": "Doublon", "email": "test@agence.cm", "mot_de_passe": "Test1234!", "role": "agent"})
    assert reponse.status_code == 409


def test_parcours_tache(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    etat = reponse.json()
    assert etat["taches"] >= 10
    assert etat["en_attente"] >= 2

    reponse = responsable.post(
        "/taches",
        json={"titre": "Tâche de test", "consigne": "faire quelque chose", "type": "analyse", "priorite": "haute"},
    )
    assert reponse.status_code == 200
    tache = reponse.json()
    assert tache["statut"] == "en_attente"
    assert tache["cree_par"] == "Ada Agence"

    # Lancer : l'agent exécute, la tâche est terminée, le journal garde la trace.
    reponse = responsable.post(f"/taches/{tache['id']}/executer")
    assert reponse.status_code == 200
    execution = reponse.json()
    assert execution["statut"] == "terminee"
    assert execution["resultat"]

    reponse = responsable.get(f"/taches?statut=terminee")
    assert any(un["id"] == tache["id"] for un in reponse.json()["taches"])

    # Une tâche terminée ne se relance pas.
    reponse = responsable.post(f"/taches/{tache['id']}/executer")
    assert reponse.status_code == 409
    assert reponse.json()["detail"]["code"] == "tache_pas_lancable"


def test_terminer_manuelle(responsable):
    reponse = responsable.post(
        "/taches",
        json={"titre": "Tâche manuelle", "type": "autre"},
    )
    tache = reponse.json()

    reponse = responsable.post(
        f"/taches/{tache['id']}/terminer",
        json={"resultat": "fait à la main"},
    )
    assert reponse.status_code == 200
    assert reponse.json()["statut"] == "terminee"
    assert reponse.json()["resultat"] == "fait à la main"

    reponse = responsable.post(
        "/taches",
        json={"titre": "Tâche ratée", "type": "autre"},
    )
    tache2 = reponse.json()
    reponse = responsable.post(
        f"/taches/{tache2['id']}/terminer",
        json={"erreur": "source manquante"},
    )
    assert reponse.json()["statut"] == "echec"
    assert reponse.json()["erreur"] == "source manquante"


def test_tache_inconnue(responsable):
    reponse = responsable.patch("/taches/99999", json={"priorite": "haute"})
    assert reponse.status_code == 404
    assert reponse.json()["detail"]["code"] == "tache_inconnue"


def test_filtrage_et_validation(responsable):
    reponse = responsable.get("/taches?type=analyse")
    assert reponse.status_code == 200
    assert all(un["type"] == "analyse" for un in reponse.json()["taches"])

    reponse = responsable.get("/taches?recherche=rapport")
    assert reponse.status_code == 200
    assert reponse.json()["total"] >= 1

    reponse = responsable.post("/taches", json={"titre": "X", "type": "inconnu"})
    assert reponse.status_code == 422

    reponse = responsable.patch("/taches/1", json={"statut": "statut_bidon"})
    assert reponse.status_code == 422


def test_executions_et_recap(responsable):
    reponse = responsable.get("/executions")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["total"] >= 3
    assert all("tache" in un for un in corps["executions"])

    reponse = responsable.get("/recap?periode=2026-11")
    assert reponse.status_code == 200
    recap = reponse.json()
    assert recap["periode"] == "2026-11"
    assert "par_type" in recap
    assert recap["executions_mois"] >= 0

    reponse = responsable.get("/recap?periode=mauvaise")
    assert reponse.status_code == 422


def test_exports_csv(responsable):
    for chemin in ("/exports/taches.csv", "/exports/executions.csv"):
        reponse = responsable.get(chemin)
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        contenu = reponse.content.decode("utf-8-sig")
        assert ";" in contenu.split("\n")[0]


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["status"] == "ok"
    assert "agent" in corps.get("service", "")


def test_validation_bilingue(responsable):
    reponse = responsable.post("/taches", json={"titre": ""})
    assert reponse.status_code == 422
    corps = reponse.json()
    assert "fr" in corps and "en" in corps
