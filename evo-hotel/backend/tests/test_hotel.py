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


def test_reservation_publique(client):
    """Le visiteur demande une chambre sans compte : la demande dort en
    « demande », la chambre reste libre jusqu'à confirmation."""
    arrivee = (date.today() + timedelta(days=20)).isoformat()
    depart = (date.today() + timedelta(days=22)).isoformat()

    dispo = client.get(f"/public/disponibilite?arrivee={arrivee}&depart={depart}")
    assert dispo.status_code == 200, dispo.text
    types = dispo.json()["types"]
    assert types, "aucun type libre sur cette période"

    type_choisi = types[0]["type"]
    entree = {
        "arrivee": arrivee,
        "depart": depart,
        "type_chambre": type_choisi,
        "client_nom": "Visiteur WhatsApp",
        "client_telephone": "699001122",
        "note": "préfère le sixième étage",
    }
    reponse = client.post("/public/reservations", json=entree)
    assert reponse.status_code == 201, reponse.text
    corps = reponse.json()
    assert corps["ok"] is True
    assert corps["chambre_type"] == type_choisi
    assert corps["nuits"] == 2
    assert corps["hotel"]["nom"]

    # La demande n'occupe pas la chambre : une seconde demande passe.
    reponse2 = client.post("/public/reservations", json={**entree, "client_nom": "Autre Visiteur"})
    assert reponse2.status_code == 201, reponse2.text


def test_deux_demandes_une_seule_confirmation(responsable, client):
    """Deux demandes en ligne peuvent viser la même chambre : la première
    confirmation passe, la seconde est refusée — la chambre est prise."""
    arrivee = (date.today() + timedelta(days=30)).isoformat()
    depart = (date.today() + timedelta(days=31)).isoformat()
    dispo = client.get(f"/public/disponibilite?arrivee={arrivee}&depart={depart}")
    types = dispo.json()["types"]
    assert types
    entree = {
        "arrivee": arrivee,
        "depart": depart,
        "type_chambre": types[0]["type"],
        "client_telephone": "",
        "note": "",
    }
    ids = []
    for nom in ("Premier Demandeur", "Second Demandeur"):
        reponse = client.post(
            "/public/reservations", json={**entree, "client_nom": nom}
        )
        assert reponse.status_code == 201, reponse.text
        ids.append(reponse.json()["reference"])

    premier = responsable.patch(f"/sejours/{ids[0]}", json={"statut": "confirmee"})
    assert premier.status_code == 200, premier.text
    # Les deux demandes sont tombées sur la même chambre (la moins chère
    # libre du type) : la seconde confirmation doit être refusée.
    second = responsable.patch(f"/sejours/{ids[1]}", json={"statut": "confirmee"})
    assert second.status_code == 422, second.text
    assert second.json()["detail"]["code"] == "chambre_occupee"


def test_confirmation_demande_verifie_la_chambre(responsable, client):
    """La réception confirme une demande : si la chambre s'est louée entre-
    temps, la confirmation est refusée."""
    arrivee = (date.today() + timedelta(days=40)).isoformat()
    depart = (date.today() + timedelta(days=42)).isoformat()
    dispo = client.get(f"/public/disponibilite?arrivee={arrivee}&depart={depart}")
    types = dispo.json()["types"]
    assert types
    entree = {
        "arrivee": arrivee,
        "depart": depart,
        "type_chambre": types[0]["type"],
        "client_nom": "Client Confirmation",
        "client_telephone": "",
        "note": "",
    }
    creation = client.post("/public/reservations", json=entree)
    assert creation.status_code == 201, creation.text

    sejours = responsable.get("/sejours").json()["sejours"]
    demande = next(un for un in sejours if un["id"] == creation.json()["reference"])
    assert demande["statut"] == "demande"

    # La confirmation passe tant que la chambre est libre.
    ok = responsable.patch(
        f"/sejours/{demande['id']}", json={"statut": "confirmee"}
    )
    assert ok.status_code == 200, ok.text
    assert ok.json()["statut"] == "confirmee"
