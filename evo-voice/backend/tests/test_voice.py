def test_seance_et_permissions(client, responsable, agent):
    reponse = client.get("/auth/me")
    assert reponse.status_code == 401

    reponse = responsable.get("/auth/me")
    assert reponse.status_code == 200
    assert reponse.json()["user"]["role"] == "responsable"

    reponse = client.post(
        "/comptes",
        json={"nom": "Test", "email": "test@bureau.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 401

    reponse = agent.post(
        "/comptes",
        json={"nom": "Test", "email": "test@bureau.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 403
    assert reponse.json()["detail"]["code"] == "droits"

    reponse = responsable.post(
        "/comptes",
        json={"nom": "Test", "email": "test@bureau.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 200

    reponse = responsable.post("/comptes", json={
        "nom": "Doublon", "email": "test@bureau.cm", "mot_de_passe": "Test1234!", "role": "agent"})
    assert reponse.status_code == 409


def test_parcours_commande(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    etat = reponse.json()
    assert etat["commandes"] >= 10
    assert etat["interpretees"] >= 1

    reponse = responsable.post(
        "/commandes",
        json={"transcription": "Rappelle-moi d'appeler le client demain"},
    )
    assert reponse.status_code == 200
    commande = reponse.json()
    assert commande["intention"] == "rappel"
    assert commande["statut"] == "interpretee"
    assert commande["auteur"] == "Ada Bureau"

    reponse = responsable.post(f"/commandes/{commande['id']}/executer")
    assert reponse.status_code == 200
    rendue = reponse.json()
    assert rendue["statut"] == "executee"
    assert rendue["resultat"]

    reponse = responsable.get("/commandes?statut=executee")
    assert any(un["id"] == commande["id"] for un in reponse.json()["commandes"])

    # Une commande exécutée ne se relance pas.
    reponse = responsable.post(f"/commandes/{commande['id']}/executer")
    assert reponse.status_code == 409
    assert reponse.json()["detail"]["code"] == "commande_pas_executable"


def test_commande_incomprise(responsable):
    reponse = responsable.post(
        "/commandes",
        json={"transcription": "Bonjour il fait beau"},
    )
    assert reponse.status_code == 200
    commande = reponse.json()
    assert commande["intention"] == ""
    assert commande["statut"] == "recue"

    reponse = responsable.post(f"/commandes/{commande['id']}/executer")
    assert reponse.status_code == 422
    assert reponse.json()["detail"]["code"] == "commande_incomprise"

    # L'humain corrige l'intention à la main, puis exécute.
    reponse = responsable.patch(
        f"/commandes/{commande['id']}",
        json={"intention": "note"},
    )
    assert reponse.status_code == 200

    reponse = responsable.post(f"/commandes/{commande['id']}/executer")
    assert reponse.status_code == 200
    assert reponse.json()["statut"] == "executee"


def test_annulation(responsable):
    reponse = responsable.post(
        "/commandes",
        json={"transcription": "Envoie un message au fournisseur"},
    )
    commande = reponse.json()
    assert commande["intention"] == "message"

    reponse = responsable.patch(
        f"/commandes/{commande['id']}",
        json={"statut": "annulee"},
    )
    assert reponse.status_code == 200
    assert reponse.json()["statut"] == "annulee"

    reponse = responsable.post(f"/commandes/{commande['id']}/executer")
    assert reponse.status_code == 409


def test_commande_inconnue(responsable):
    reponse = responsable.patch("/commandes/99999", json={"intention": "note"})
    assert reponse.status_code == 404
    assert reponse.json()["detail"]["code"] == "commande_inconnue"


def test_filtrage_et_validation(responsable):
    reponse = responsable.get("/commandes?intention=rappel")
    assert reponse.status_code == 200
    assert all(un["intention"] == "rappel" for un in reponse.json()["commandes"])

    reponse = responsable.get("/commandes?recherche=fournisseur")
    assert reponse.status_code == 200
    assert reponse.json()["total"] >= 1

    reponse = responsable.post("/commandes", json={"transcription": "ok"})
    assert reponse.status_code == 422

    reponse = responsable.patch("/commandes/1", json={"intention": "intention_bidon"})
    assert reponse.status_code == 422


def test_recap_et_export(responsable):
    reponse = responsable.get("/recap?periode=2026-11")
    assert reponse.status_code == 200
    recap = reponse.json()
    assert recap["periode"] == "2026-11"
    assert "par_intention" in recap
    assert recap["recues_mois"] >= 1

    reponse = responsable.get("/recap?periode=mauvaise")
    assert reponse.status_code == 422

    reponse = responsable.get("/exports/commandes.csv")
    assert reponse.status_code == 200
    assert "text/csv" in reponse.headers["content-type"]
    contenu = reponse.content.decode("utf-8-sig")
    assert ";" in contenu.split("\n")[0]


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["status"] == "ok"
    assert corps["service"] == "evo-voice"
    assert "aucune commande" in corps["envoi"]


def test_validation_bilingue(responsable):
    reponse = responsable.post("/commandes", json={"transcription": ""})
    assert reponse.status_code == 422
    corps = reponse.json()
    assert "fr" in corps and "en" in corps
