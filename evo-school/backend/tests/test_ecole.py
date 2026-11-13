"""Le cahier des frais, de bout en bout."""


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    assert reponse.json()["service"] == "evo-school"


def test_sans_seance(client):
    assert client.get("/etat").status_code == 401


def test_etat_de_la_caisse(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["classes"] >= 8
    assert corps["eleves"] > 0


def test_eleve_et_reste(responsable, eleve_test):
    """Le reste se calcule à la lecture : attendu − payé."""
    assert eleve_test["frais_attendu"] == 40000
    assert eleve_test["paye"] == 0
    assert eleve_test["reste"] == 40000


def test_versement_et_recu(responsable, comptable, eleve_test):
    reponse = comptable.post(
        "/versements",
        json={"eleve_id": eleve_test["id"], "montant": 15000, "moyen": "mtn_money"},
    )
    assert reponse.status_code == 200, reponse.text
    corps = reponse.json()
    assert corps["montant"] == 15000
    assert corps["recu"]
    assert corps["periode"]

    # Le reste a baissé.
    eleves = responsable.get("/eleves").json()["eleves"]
    apres = next(un for un in eleves if un["id"] == eleve_test["id"])
    assert apres["paye"] == 15000
    assert apres["reste"] == 25000


def test_recu_public_par_code(client, responsable, comptable, eleve_test):
    """Le reçu se vérifie sans compte : un code, un versement."""
    versement = comptable.post(
        "/versements",
        json={"eleve_id": eleve_test["id"], "montant": 5000, "moyen": "especes"},
    ).json()

    # Le client sans session lit le reçu.
    client.cookies.clear()
    reponse = client.get(f"/public/recu/{versement['recu']}")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["valide"] is True
    assert corps["montant"] == 5000
    assert corps["eleve"] == eleve_test["nom"]

    # Un code qui n'existe pas répond non, sans détail.
    faux = client.get("/public/recu/XXXXX00000")
    assert faux.status_code == 200
    assert faux.json()["valide"] is False


def test_annulation_du_versement(responsable, comptable, eleve_test):
    versement = comptable.post(
        "/versements",
        json={"eleve_id": eleve_test["id"], "montant": 8000, "moyen": "orange_money"},
    ).json()
    assert comptable.patch(
        f"/versements/{versement['id']}", json={"annule": True, "note": "erreur de montant"}
    ).status_code == 200

    # Le reste remonte : le seul versement de ce test est annulé.
    eleves = responsable.get("/eleves").json()["eleves"]
    apres = next(un for un in eleves if un["id"] == eleve_test["id"])
    assert apres["paye"] == 0
    assert apres["reste"] == 40000

    # Une seconde annulation est refusée.
    refus = comptable.patch(f"/versements/{versement['id']}", json={"annule": True})
    assert refus.status_code == 409


def test_versement_dans_le_futur_refuse(responsable, eleve_test):
    from datetime import date, timedelta

    futur = (date.today() + timedelta(days=10)).isoformat()
    reponse = responsable.post(
        "/versements",
        json={"eleve_id": eleve_test["id"], "montant": 1000, "date": futur},
    )
    assert reponse.status_code == 422


def test_recap_du_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["periode"]
    assert corps["encaisses"] >= 0
    assert len(corps["par_classe"]) >= 8
    assert len(corps["par_eleve"]) > 0


def test_comptable_ne_touche_pas_aux_classes(responsable, comptable):
    """Le comptable encaisse, le responsable seul touche aux classes."""
    reponse = comptable.post(
        "/classes",
        json={"nom": "Test interdit", "titulaire": "", "frais_annuels": 1000},
    )
    assert reponse.status_code == 403


def test_exports(responsable):
    for chemin in ("/exports/classes.csv", "/exports/eleves.csv", "/exports/versements.csv"):
        reponse = responsable.get(chemin)
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
