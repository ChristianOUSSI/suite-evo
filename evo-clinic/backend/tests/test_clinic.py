"""Le registre de la clinique : actes, paiements, reçus vérifiables."""

from datetime import date, timedelta


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-clinic"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["patients"] > 50
    assert etat["actes_mois"] >= 0
    assert etat["ca_total"] > 0


def test_patients_et_dettes(responsable, patient_test):
    patients = responsable.get("/patients").json()["patients"]
    assert len(patients) > 50
    detteurs = responsable.get("/patients?detteurs=true").json()["patients"]
    assert all(un["dus"] > 0 for un in detteurs)


def test_acte_fige_son_prix(responsable, patient_test, acte_test):
    assert acte_test["montant"] == 10000
    fiche = responsable.get(f"/patients/{patient_test['id']}").json()
    assert fiche["dus"] == 10000
    assert fiche["actes"] == 1


def test_paiement_et_recu(responsable, patient_test, acte_test):
    reponse = responsable.post(
        "/paiements",
        json={
            "patient_id": patient_test["id"],
            "acte_id": acte_test["id"],
            "montant": 6000,
            "moyen": "mtn_money",
            "note": "",
        },
    )
    assert reponse.status_code == 200, reponse.text
    paiement = reponse.json()
    assert paiement["recu"]
    assert len(paiement["recu"]) == 10

    fiche = responsable.get(f"/patients/{patient_test['id']}").json()
    assert fiche["dus"] == 4000


def test_recu_public_sans_compte(client, responsable, patient_test, acte_test):
    paiement = responsable.post(
        "/paiements",
        json={"patient_id": patient_test["id"], "montant": 10000, "moyen": "especes"},
    ).json()
    client.cookies.clear()  # aucune session : le reçu se vérifie quand même
    reponse = client.get(f"/public/recu/{paiement['recu']}")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["valide"] is True
    assert corps["patient"] == patient_test["nom"]
    assert corps["montant"] == 10000

    inconnu = client.get("/public/recu/ZZZZZZZZZZ")
    assert inconnu.json()["valide"] is False


def test_annulation_exclut_du_dette(responsable, patient_test, acte_test):
    paiement = responsable.post(
        "/paiements",
        json={"patient_id": patient_test["id"], "montant": 4000, "moyen": "especes"},
    ).json()
    avant = responsable.get(f"/patients/{patient_test['id']}").json()["dus"]
    assert avant == 6000

    corrige = responsable.patch(
        f"/paiements/{paiement['id']}", json={"annule": True, "note": "erreur de caisse"}
    )
    assert corrige.status_code == 200
    apres = responsable.get(f"/patients/{patient_test['id']}").json()["dus"]
    assert apres == 10000


def test_date_future_refusee(responsable, patient_test):
    demain = (date.today() + timedelta(days=2)).isoformat()
    reponse = responsable.post(
        "/actes",
        json={"patient_id": patient_test["id"], "date": demain, "montant": 5000},
    )
    assert reponse.status_code == 422

    reponse = responsable.post(
        "/paiements",
        json={"patient_id": patient_test["id"], "date": demain, "montant": 5000},
    )
    assert reponse.status_code == 422


def test_agent_encaisse_mais_ne_touche_pas_au_registre(agent, patient_test, acte_test):
    # L'agent (accueil) encaisse.
    reponse = agent.post(
        "/paiements",
        json={"patient_id": patient_test["id"], "montant": 1000, "moyen": "especes"},
    )
    assert reponse.status_code == 200, reponse.text

    # L'agent consigne aussi l'acte du jour.
    assert agent.post("/actes", json={"patient_id": patient_test["id"], "montant": 100}).status_code == 200

    # Mais il n'annule rien et ne touche ni aux comptes ni aux réglages.
    assert agent.post("/comptes", json={"nom": "X Y", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"}).status_code == 403
    assert agent.put("/organisation", json={"nom": "Autre", "ville": "Yaoundé"}).status_code == 403


def test_recap_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["periode"]
    assert corps["encaisses"] >= 0
    assert "par_motif" in corps
    assert "par_patient" in corps


def test_export_csv(responsable):
    for nom in ("patients.csv", "actes.csv", "paiements.csv"):
        reponse = responsable.get(f"/exports/{nom}")
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        assert reponse.text.splitlines()


def test_rendez_vous_public(responsable):
    """Le patient demande un rendez-vous sans compte ; la clinique tranche."""
    from fastapi.testclient import TestClient

    from app.main import app

    anonyme = TestClient(app)
    reponse = anonyme.post(
        "/public/rendez-vous",
        json={
            "nom": "Marie Ngo",
            "telephone": "677 44 55 66",
            "motif": "Fever and headache",
            "jour": "2030-01-15",
            "heure": "09:30",
            "note": "First visit",
        },
    )
    assert reponse.status_code == 201, reponse.text
    corps = reponse.json()
    assert corps["ok"] and corps["statut"] == "demande"

    liste = responsable.get("/rendez-vous").json()
    assert liste["demandes"] >= 1
    rdv = next(r for r in liste["rendez_vous"] if r["id"] == corps["id"])
    assert rdv["telephone"].startswith("+237")

    ok = responsable.patch(
        f"/rendez-vous/{corps['id']}", json={"statut": "confirme"}
    )
    assert ok.status_code == 200
    assert ok.json()["statut"] == "confirme"
