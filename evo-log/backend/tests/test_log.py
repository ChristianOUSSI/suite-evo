"""Le registre du transporteur : colis, numéros de suivi, suivi public."""


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-log"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["colis"] > 30
    assert etat["deposes_mois"] >= 0
    assert etat["a_percevoir"] >= 0


def test_depot_et_numero(agent, colis_test):
    assert colis_test["numero"]
    assert len(colis_test["numero"]) == 10
    assert colis_test["statut"] == "recu"
    assert colis_test["frais"] == 15000
    assert colis_test["agent"]

    # Le numéro ne contient ni I, O, 0 ni 1 : il se dicte au téléphone.
    assert not set(colis_test["numero"]) & set("IO01")


def test_statut_et_livraison(responsable, agent, colis_test):
    for statut in ("en_transit", "arrive", "distribue"):
        reponse = agent.patch(f"/colis/{colis_test['id']}", json={"statut": statut})
        assert reponse.status_code == 200, reponse.text
        corps = reponse.json()
        assert corps["statut"] == statut

    # Distribué pose la date de livraison toute seule.
    assert corps["date_livraison"]

    # Repasser en transit efface la livraison : le colis n'est plus livré.
    retour = agent.patch(f"/colis/{colis_test['id']}", json={"statut": "en_transit"})
    assert retour.status_code == 200
    assert retour.json()["date_livraison"] is None


def test_recherche_par_numero(responsable, colis_test):
    reponse = responsable.get(f"/colis?recherche={colis_test['numero']}")
    assert reponse.status_code == 200
    numeros = [un["numero"] for un in reponse.json()["colis"]]
    assert colis_test["numero"] in numeros


def test_suivi_public_sans_compte(client, colis_test):
    client.cookies.clear()
    reponse = client.get(f"/public/suivi/{colis_test['numero']}")
    assert reponse.status_code == 200, reponse.text
    suivi = reponse.json()["colis"]
    assert suivi["numero"] == colis_test["numero"]
    assert suivi["depart"] == "Douala"
    assert suivi["arrivee"] == "Yaoundé"
    # Le suivi public ne montre ni expéditeur ni téléphone.
    assert "expediteur_nom" not in suivi
    assert "destinataire_telephone" not in suivi

    inconnu = client.get("/public/suivi/Z9Z9Z9Z9Z9")
    assert inconnu.status_code == 404


def test_filtres(responsable):
    tous = responsable.get("/colis").json()["total"]
    transit = responsable.get("/colis?statut=en_transit").json()
    assert transit["total"] < tous or tous == 0
    assert all(un["statut"] == "en_transit" for un in transit["colis"])

    par_ville = responsable.get("/colis?trajet=Yaoundé").json()
    assert all(un["depart"] == "Yaoundé" or un["arrivee"] == "Yaoundé" for un in par_ville["colis"])


def test_recap_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["periode"]
    assert "par_trajet" in corps
    assert "par_genre" in corps
    assert "par_statut" in corps


def test_export_csv(responsable):
    for nom in ("colis.csv", "suivis.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        assert reponse.text.splitlines()


def test_agent_fait_le_quotidien_mais_pas_les_comptes(agent, responsable):
    assert agent.post("/comptes", json={"nom": "X Y", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"}).status_code == 403
    assert agent.put("/organisation", json={"nom": "Autre Transport"}).status_code == 403


def test_ville_inconnue_refusee(agent):
    reponse = agent.post(
        "/colis",
        json={
            "genre": "colis",
            "expediteur_nom": "A B",
            "destinataire_nom": "C D",
            "depart": "Paris",
            "arrivee": "Lyon",
        },
    )
    assert reponse.status_code == 422
