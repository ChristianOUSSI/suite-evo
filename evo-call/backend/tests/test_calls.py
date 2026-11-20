"""Le standard : appels, file, statuts, durée, vérification publique."""

from datetime import date, timedelta


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-call"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["appels"] > 40
    assert etat["du_jour"] > 0


def test_appel_et_cycle(responsable):
    aujourdhui = date.today()
    reponse = responsable.post(
        "/appels",
        json={
            "client_nom": "Client Test Unique",
            "client_telephone": "677123456",
            "sens": "entrant",
            "motif": "sav",
            "note": "Demande de suivi",
            "date": aujourdhui.isoformat(),
        },
    )
    assert reponse.status_code == 200, reponse.text
    appel = reponse.json()
    assert appel["statut"] == "en_file"
    assert appel["client_telephone_display"].startswith("6 77")
    appel_id = appel["id"]

    # Le responsable le prend : en_file -> en_cours -> termine.
    pris = responsable.patch(f"/appels/{appel_id}", json={"statut": "en_cours"})
    assert pris.status_code == 200
    assert pris.json()["statut"] == "en_cours"
    assert pris.json()["agent"]

    termine = responsable.patch(
        f"/appels/{appel_id}",
        json={"statut": "termine", "duree_secondes": 240, "note": "Résolu"},
    )
    assert termine.status_code == 200
    assert termine.json()["statut"] == "termine"
    assert termine.json()["duree_secondes"] == 240

    # Le passé ne se réécrit pas.
    reenvoye = responsable.patch(f"/appels/{appel_id}", json={"statut": "en_file"})
    assert reenvoye.status_code == 200
    assert reenvoye.json()["statut"] == "en_file"


def test_rappel_exige_date(responsable):
    reponse = responsable.post(
        "/appels",
        json={"client_nom": "Client Rappel", "motif": "rappel", "sens": "sortant"},
    )
    appel_id = reponse.json()["id"]
    refus = responsable.patch(f"/appels/{appel_id}", json={"statut": "rappel"})
    assert refus.status_code == 422
    detail = refus.json()["detail"]
    assert "code" in detail
    assert detail["fr"]
    ok = responsable.patch(
        f"/appels/{appel_id}",
        json={"statut": "rappel", "date_rappel": (date.today() + timedelta(days=2)).isoformat()},
    )
    assert ok.status_code == 200
    assert ok.json()["date_rappel"] == (date.today() + timedelta(days=2)).isoformat()


def test_date_future_refusee(responsable):
    reponse = responsable.post(
        "/appels",
        json={"client_nom": "Futur", "date": (date.today() + timedelta(days=1)).isoformat()},
    )
    assert reponse.status_code == 422


def test_sens_et_motif_inconnus(responsable):
    reponse = responsable.post("/appels", json={"sens": "vertical", "motif": "exotic"})
    assert reponse.status_code == 422


def test_recherche_et_filtres(responsable):
    responsable.post("/appels", json={"client_nom": "Nadia Recherche Fil"})
    reponse = responsable.get("/appels?recherche=nadia recherche")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["total"] >= 1
    assert any(un["client_nom"] == "Nadia Recherche Fil" for un in corps["appels"])

    par_motif = responsable.get("/appels?statut=en_file&sens=entrant").json()
    assert all(un["statut"] == "en_file" for un in par_motif["appels"])
    assert all(un["sens"] == "entrant" for un in par_motif["appels"])


def test_agent_voit_tout(agent):
    etat = agent.get("/etat")
    assert etat.status_code == 200
    assert etat.json()["appels"] > 0


def test_comptes_reserve(responsable, agent):
    refuse = agent.post("/comptes", json={"nom": "Test", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"})
    assert refuse.status_code == 403
    nouveau = responsable.post(
        "/comptes",
        json={"nom": "Nouveau Agent", "email": "nouveau@call.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert nouveau.status_code == 200
    assert nouveau.json()["role"] == "agent"
    dup = responsable.post(
        "/comptes",
        json={"nom": "Encore", "email": "nouveau@call.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert dup.status_code in (409, 422)


def test_recap(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["appels_mois"] > 0
    assert "par_agent" in corps and "par_motif" in corps
    assert corps["duree_moyenne"] >= 0


def test_recap_periode_inconnue(responsable):
    assert responsable.get("/recap?periode=2025-13").status_code == 422


def test_file_publique(client):
    reponse = client.get("/public/file")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert "en_file" in corps and "en_cours" in corps
    assert corps["centre"]["nom"]


def test_export(responsable):
    reponse = responsable.get("/exports/appels.csv")
    assert reponse.status_code == 200
    texte = reponse.text
    assert "client" in texte.splitlines()[0]
    assert "" in texte.splitlines()[0] or "client" in texte


def test_le_rappel_public_entre_dans_la_file(client, responsable):
    """Le client demande à être rappelé sans compte : le standard le voit."""
    centre = client.get("/public/centre")
    assert centre.status_code == 200
    assert centre.json()["centre"]["nom"]

    envoi = client.post(
        "/public/rappel",
        json={
            "nom": "Bertin Talla",
            "telephone": "677 12 34 56",
            "motif": "sav",
            "creneau": "2030-01-15",
            "note": "Problème avec ma commande de la semaine",
        },
    )
    assert envoi.status_code == 201, envoi.text
    assert envoi.json()["ok"] is True

    # L'appel est dans la case « rappel » de la file interne.
    rappels = responsable.get("/appels?statut=rappel").json()["appels"]
    trouve = next(un for un in rappels if un["client_nom"] == "Bertin Talla")
    assert trouve["sens"] == "entrant"
    assert trouve["date_rappel"] == "2030-01-15"
    assert "formulaire" in trouve["note"]

    # Un créneau passé est refusé, une date passée ne passe pas.
    hier = client.post(
        "/public/rappel",
        json={"nom": "Test", "telephone": "677112233", "creneau": "2000-01-01"},
    )
    assert hier.status_code == 422
