def test_seance_et_permissions(client, responsable, agent):
    reponse = client.get("/auth/me")
    assert reponse.status_code == 401

    reponse = responsable.get("/auth/me")
    assert reponse.status_code == 200
    assert reponse.json()["user"]["role"] == "responsable"

    reponse = client.post(
        "/comptes",
        json={"nom": "Test", "email": "test@carnet.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 401

    reponse = agent.post(
        "/comptes",
        json={"nom": "Test", "email": "test@carnet.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 403
    assert reponse.json()["detail"]["code"] == "droits"

    reponse = responsable.post(
        "/comptes",
        json={"nom": "Test", "email": "test@carnet.cm", "mot_de_passe": "Test1234!", "role": "agent"},
    )
    assert reponse.status_code == 200

    reponse = responsable.post("/comptes", json={
        "nom": "Doublon", "email": "test@carnet.cm", "mot_de_passe": "Test1234!", "role": "agent"})
    assert reponse.status_code == 409


def test_parcours_note(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    etat = reponse.json()
    assert etat["notes"] >= 10
    assert etat["epinglees"] >= 3

    reponse = responsable.post(
        "/notes",
        json={"titre": "Ma note test", "contenu": "du pain et du lait", "categorie": "courses"},
    )
    assert reponse.status_code == 200
    note = reponse.json()
    assert note["categorie"] == "courses"
    assert note["code_partage"]

    reponse = responsable.patch(f"/notes/{note['id']}", json={"epinglee": True})
    assert reponse.status_code == 200
    assert reponse.json()["epinglee"] is True

    reponse = responsable.patch(f"/notes/{note['id']}", json={"archivee": True})
    assert reponse.status_code == 200
    assert reponse.json()["archivee"] is True


def test_note_inconnue(responsable):
    reponse = responsable.patch("/notes/99999", json={"epinglee": True})
    assert reponse.status_code == 404
    assert reponse.json()["detail"]["code"] == "note_inconnue"


def test_categorie_et_recherche(responsable):
    reponse = responsable.get("/notes?categorie=sante")
    assert reponse.status_code == 200
    notes = reponse.json()["notes"]
    assert all(un["categorie"] == "sante" for un in notes)

    reponse = responsable.get("/notes?recherche=recette")
    assert reponse.status_code == 200
    assert reponse.json()["total"] >= 1

    reponse = responsable.post("/notes", json={"titre": "X", "categorie": "inconnue"})
    assert reponse.status_code == 422


def test_partage_public(client, responsable):
    """La note partagée se lit sans compte, au code près."""
    reponse = responsable.post(
        "/notes",
        json={"titre": "Note à partager", "contenu": "le code wifi", "categorie": "perso"},
    )
    note = reponse.json()
    code = note["code_partage"]

    reponse = client.get(f"/public/notes/{code}")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["note"]["titre"] == "Note à partager"
    assert "code_partage" not in corps["note"]
    assert corps["carnet"]["nom"]

    # Nouveau code : l'ancien lien meurt.
    reponse = responsable.patch(f"/notes/{note['id']}", json={"nouveau_code": True})
    nouveau = reponse.json()["code_partage"]
    assert nouveau != code

    reponse = client.get(f"/public/notes/{code}")
    assert reponse.status_code == 404

    reponse = client.get(f"/public/notes/{nouveau}")
    assert reponse.status_code == 200

    reponse = client.get("/public/notes/INEXISTANT")
    assert reponse.status_code == 404


def test_recap_et_periode(responsable):
    reponse = responsable.get("/recap?periode=2026-11")
    assert reponse.status_code == 200
    recap = reponse.json()
    assert recap["periode"] == "2026-11"
    assert "par_categorie" in recap

    reponse = responsable.get("/recap?periode=mauvaise")
    assert reponse.status_code == 422
    assert reponse.json()["detail"]["code"] == "periode_inconnue"


def test_exports_csv(responsable):
    reponse = responsable.get("/exports/notes.csv")
    assert reponse.status_code == 200
    assert "text/csv" in reponse.headers["content-type"]
    contenu = reponse.content.decode("utf-8-sig")
    assert ";" in contenu.split("\n")[0]
    assert "titre" in contenu.split("\n")[0]


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["status"] == "ok"
    assert "carnet" in corps.get("service", "")


def test_validation_bilingue(responsable):
    reponse = responsable.post("/notes", json={"titre": ""})
    assert reponse.status_code == 422
    corps = reponse.json()
    assert "fr" in corps and "en" in corps
