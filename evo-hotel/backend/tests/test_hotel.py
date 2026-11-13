"""Le cahier des chambres, de bout en bout."""

from datetime import date, timedelta


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    assert reponse.json()["service"] == "evo-hotel"


def test_sans_seance(client):
    assert client.get("/etat").status_code == 401


def test_mauvais_mot_de_passe(client):
    reponse = client.post(
        "/auth/login",
        json={"email": "ada@hotellba.cm", "mot_de_passe": "mauvais"},
    )
    assert reponse.status_code == 401
    detail = reponse.json()["detail"]
    assert detail["code"] == "identifiants"
    assert "fr" in detail and "en" in detail


def test_etat_de_la_reception(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["chambres"] == 12
    assert corps["libres"] + corps["occupees"] <= corps["chambres"]


def test_reservation_cree_puis_listee(responsable, chambre_libre, client_test):
    demain = (date.today() + timedelta(days=2)).isoformat()
    apres = (date.today() + timedelta(days=4)).isoformat()
    entree = {
        "chambre_id": chambre_libre["id"],
        "client_id": client_test["id"],
        "arrivee": demain,
        "depart": apres,
    }
    reponse = responsable.post("/sejours", json=entree)
    assert reponse.status_code == 200, reponse.text
    corps = reponse.json()
    assert corps["statut"] == "confirmee"
    assert corps["nuits"] == 2
    assert corps["montant"] == 30000
    assert corps["chambre"] == chambre_libre["numero"]

    sejours = responsable.get(f"/sejours?du={demain}").json()["sejours"]
    assert any(un["id"] == corps["id"] for un in sejours)


def test_chevauchement_refuse(responsable, chambre_libre, client_test):
    base = date.today() + timedelta(days=10)
    entree = {
        "chambre_id": chambre_libre["id"],
        "client_id": client_test["id"],
        "arrivee": base.isoformat(),
        "depart": (base + timedelta(days=3)).isoformat(),
    }
    assert responsable.post("/sejours", json=entree).status_code == 200

    # Un séjour qui se touche sans se chevaucher est légal.
    touche = {
        **entree,
        "arrivee": (base + timedelta(days=3)).isoformat(),
        "depart": (base + timedelta(days=5)).isoformat(),
    }
    assert responsable.post("/sejours", json=touche).status_code == 200

    # Un vrai chevauchement est refusé, dans les deux langues.
    chevauche = {
        **entree,
        "arrivee": (base + timedelta(days=2)).isoformat(),
        "depart": (base + timedelta(days=6)).isoformat(),
    }
    refus = responsable.post("/sejours", json=chevauche)
    assert refus.status_code == 422
    assert refus.json()["detail"]["code"] == "chambre_occupee"


def test_dates_invalides(responsable, chambre_libre, client_test):
    jour = (date.today() + timedelta(days=5)).isoformat()
    reponse = responsable.post(
        "/sejours",
        json={
            "chambre_id": chambre_libre["id"],
            "client_id": client_test["id"],
            "arrivee": jour,
            "depart": jour,
        },
    )
    assert reponse.status_code == 422
    assert reponse.json()["detail"]["code"] == "dates_invalides"


def test_cycle_de_vie_du_sejour(responsable, chambre_libre, client_test):
    hier = (date.today() - timedelta(days=1)).isoformat()
    demain = (date.today() + timedelta(days=2)).isoformat()
    sejour = responsable.post(
        "/sejours",
        json={
            "chambre_id": chambre_libre["id"],
            "client_id": client_test["id"],
            "arrivee": hier,
            "depart": demain,
        },
    ).json()

    # La chambre est en cours tant que le départ n'est pas passé.
    etat = responsable.get("/etat").json()
    assert etat["en_cours"] >= 1

    cloture = responsable.patch(
        f"/sejours/{sejour['id']}", json={"statut": "terminee"}
    )
    assert cloture.status_code == 200
    assert cloture.json()["statut"] == "terminee"

    # Un séjour clos ne se rouvre pas.
    reouverture = responsable.patch(
        f"/sejours/{sejour['id']}", json={"statut": "confirmee"}
    )
    assert reouverture.status_code == 409


def test_annulation_libere_la_chambre(responsable, chambre_libre, client_test):
    base = date.today() + timedelta(days=20)
    entree = {
        "chambre_id": chambre_libre["id"],
        "client_id": client_test["id"],
        "arrivee": base.isoformat(),
        "depart": (base + timedelta(days=2)).isoformat(),
    }
    sejour = responsable.post("/sejours", json=entree).json()
    assert responsable.patch(
        f"/sejours/{sejour['id']}", json={"statut": "annulee"}
    ).status_code == 200
    # La même chambre, mêmes dates : plus de refus.
    assert responsable.post("/sejours", json=entree).status_code == 200


def test_disponibilite(responsable, chambre_libre):
    demain = (date.today() + timedelta(days=30)).isoformat()
    apres = (date.today() + timedelta(days=32)).isoformat()
    reponse = responsable.get(f"/disponibilite?arrivee={demain}&depart={apres}")
    assert reponse.status_code == 200
    numeros = [un["numero"] for un in reponse.json()["chambres"]]
    assert chambre_libre["numero"] in numeros


def test_recap_du_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["chambres"] >= 12
    assert 0 <= corps["taux_occupation"] <= 100
    assert corps["montant"] >= 0
    assert len(corps["par_chambre"]) == corps["chambres"]


def test_recap_periode_invalide(responsable):
    reponse = responsable.get("/recap?periode=2026-13")
    assert reponse.status_code == 422


def test_client_connu_revient_par_telephone(responsable, chambre_libre):
    """Un numéro connu ne crée pas une seconde fiche."""
    from uuid import uuid4

    # Numéro fixe de test, distinct des données de démonstration.
    telephone = "+237699123987"
    premier = responsable.post(
        "/sejours",
        json={
            "chambre_id": chambre_libre["id"],
            "client_nom": f"Client {uuid4().hex[:6]}",
            "client_telephone": telephone,
            "arrivee": (date.today() + timedelta(days=40)).isoformat(),
            "depart": (date.today() + timedelta(days=41)).isoformat(),
        },
    )
    assert premier.status_code == 200, premier.text

    clients = responsable.get("/clients").json()["clients"]
    connus = [un for un in clients if un["telephone"] == telephone]
    assert len(connus) == 1
    assert connus[0]["nom"] == premier.json()["client"]


def test_receptionniste_ne_touche_pas_aux_chambres(responsable, accueil, chambre_libre):
    """La réception gère les séjours, le responsable seul les chambres."""
    reponse = accueil.post(
        "/chambres",
        json={"numero": "X99", "type": "standard", "prix_par_nuit": 10000, "capacite": 2},
    )
    assert reponse.status_code == 403

    # Mais elle peut réserver.
    sejour = accueil.post(
        "/sejours",
        json={
            "chambre_id": chambre_libre["id"],
            "client_nom": "Client Comptoir",
            "arrivee": (date.today() + timedelta(days=50)).isoformat(),
            "depart": (date.today() + timedelta(days=51)).isoformat(),
        },
    )
    assert sejour.status_code == 200, sejour.text


def test_exports(responsable):
    for chemin in ("/exports/chambres.csv", "/exports/clients.csv", "/exports/sejours.csv"):
        reponse = responsable.get(chemin)
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        assert reponse.text.startswith("﻿")
