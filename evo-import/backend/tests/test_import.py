"""Le quai : envois, numéro de suivi, parcours, suivi public."""

from datetime import date


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-import"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["envois"] >= 12
    assert etat["clients"] == 10


def test_envoi_et_suivi(responsable, client):
    reponse = responsable.post(
        "/envois",
        json={
            "description": "Cartons test unique",
            "mode": "maritime",
            "expéditeur_pays": "France",
            "destinataire_nom": "Client Test",
            "destinataire_ville": "Douala",
            "poids_kg": 120.5,
            "valeur_declaree": 900000,
            "frais": 75000,
            "date_envoi": date.today().isoformat(),
        },
    )
    assert reponse.status_code == 200, reponse.text
    envoi = reponse.json()
    assert len(envoi["numero_suivi"]) == 10
    assert envoi["statut"] == "en_attente"
    assert len(envoi["suivi"]) == 1
    envoi_id = envoi["id"]
    numero = envoi["numero_suivi"]

    # Le parcours avance : chaque passage laisse sa ligne.
    for statut in ("en_transit", "en_douane", "livre"):
        reponse = responsable.post(
            f"/envois/{envoi_id}/suivi",
            json={"statut": statut, "note": f"Étape {statut}"},
        )
        assert reponse.status_code == 200, reponse.text
        assert reponse.json()["statut"] == statut

    final = responsable.get(f"/envois/{envoi_id}").json()
    assert final["date_livraison"] == date.today().isoformat()
    assert len(final["suivi"]) == 4
    assert [un["statut"] for un in final["suivi"]] == ["en_attente", "en_transit", "en_douane", "livre"]

    # Le numéro de suivi est public : le destinataire lit le parcours.
    public = client.get(f"/public/suivi/{numero}")
    assert public.status_code == 200, public.text
    corps = public.json()
    assert corps["statut"] == "livre"
    assert corps["numero_suivi"] == numero
    assert "client" not in corps and "client_id" not in corps and "frais" not in corps

    # Un numéro inconnu est refusé.
    assert client.get("/public/suivi/ZZZZZZZZZZ").status_code == 404


def test_mode_et_statut_invalides(responsable):
    reponse = responsable.post("/envois", json={"description": "Test", "mode": "teleportation"})
    assert reponse.status_code == 422
    envois = responsable.get("/envois").json()["envois"]
    envoi_id = envois[0]["id"]
    refuse = responsable.post(f"/envois/{envoi_id}/suivi", json={"statut": "volé"})
    assert refuse.status_code == 422


def test_date_future_refusee(responsable):
    reponse = responsable.post(
        "/envois",
        json={"description": "Futur", "date_envoi": "2099-01-01"},
    )
    assert reponse.status_code == 422


def test_recherche_et_filtres(responsable):
    responsable.post(
        "/envois",
        json={"description": "Recherche Unique Fret", "destinataire_ville": "Bafoussam"},
    )
    reponse = responsable.get("/envois?recherche=recherche unique")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["total"] >= 1
    assert any(un["description"] == "Recherche Unique Fret" for un in corps["envois"])

    par_statut = responsable.get("/envois?statut=en_transit").json()
    assert all(un["statut"] == "en_transit" for un in par_statut["envois"])
    par_mode = responsable.get("/envois?mode=aerien").json()
    assert all(un["mode"] == "aerien" for un in par_mode["envois"])


def test_client_telephone(responsable):
    reponse = responsable.post(
        "/clients",
        json={"nom": "Client Quai Test", "telephone": "6 99 88 77 66", "type": "revendeur"},
    )
    assert reponse.status_code == 200
    assert reponse.json()["telephone"] == "+237699887766"
    assert reponse.json()["telephone_joignable"] is True

    refuse = responsable.post("/clients", json={"nom": "Client Type", "type": "vip"})
    assert refuse.status_code == 422


def test_agent_voit_tout(agent):
    etat = agent.get("/etat")
    assert etat.status_code == 200
    assert etat.json()["envois"] > 0


def test_comptes_reserve(responsable, agent):
    refuse = agent.post("/comptes", json={"nom": "Test", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"})
    assert refuse.status_code == 403
    nouveau = responsable.post(
        "/comptes",
        json={"nom": "Nouveau Agent", "email": "nouveau@import.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert nouveau.status_code == 200
    assert nouveau.json()["role"] == "agent"
    dup = responsable.post(
        "/comptes",
        json={"nom": "Encore", "email": "nouveau@import.cm", "mot_de_passe": "abcdef", "role": "agent"},
    )
    assert dup.status_code in (409, 422)


def test_recap(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert "par_mode" in corps and "par_ville" in corps and "par_statut" in corps
    assert corps["frais_mois"] >= 0


def test_recap_periode_inconnue(responsable):
    assert responsable.get("/recap?periode=2025-13").status_code == 422


def test_exports(responsable):
    for nom in ("envois.csv", "clients.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
