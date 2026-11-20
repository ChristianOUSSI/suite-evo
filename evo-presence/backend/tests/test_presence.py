"""Le pointage de présence, de bout en bout."""

from datetime import date, timedelta


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    assert reponse.json()["service"] == "evo-presence"


def test_sans_seance(client):
    assert client.get("/etat").status_code == 401


def test_mauvais_mot_de_passe(client):
    reponse = client.post(
        "/auth/login",
        json={"email": "ada@horizon.cm", "mot_de_passe": "mauvais"},
    )
    assert reponse.status_code == 401
    detail = reponse.json()["detail"]
    assert detail["code"] == "identifiants"
    assert "fr" in detail and "en" in detail


def test_etat_du_jour(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["effectif"] > 0
    assert corps["pointes"] == 0 or corps["pointes"] <= corps["effectif"]
    assert corps["a_pointer"] >= 0


def test_pointage_cree_puis_corrige(responsable, un_employe):
    hier = (date.today() - timedelta(days=1)).isoformat()
    entree = {
        "employe_id": un_employe["id"],
        "jour": hier,
        "statut": "present",
        "arrivee": "08:00",
        "depart": "17:00",
        "note": "",
    }
    premier = responsable.post("/pointages", json=entree)
    assert premier.status_code == 200, premier.text
    assert premier.json()["statut"] == "present"

    # Le second pointage du même jour corrige, il ne double pas.
    entree["statut"] = "retard"
    entree["arrivee"] = "08:45"
    second = responsable.post("/pointages", json=entree)
    assert second.status_code == 200
    assert second.json()["id"] == premier.json()["id"]
    assert second.json()["statut"] == "retard"

    equipe = responsable.get(f"/pointage?jour={hier}").json()["equipe"]
    ligne = next(un for un in equipe if un["employe_id"] == un_employe["id"])
    assert ligne["statut"] == "retard"
    assert ligne["pointe"] is True


def test_refus_date_future(responsable, un_employe):
    demain = (date.today() + timedelta(days=1)).isoformat()
    reponse = responsable.post(
        "/pointages",
        json={
            "employe_id": un_employe["id"],
            "jour": demain,
            "statut": "present",
        },
    )
    assert reponse.status_code == 422
    assert reponse.json()["detail"]["code"] == "date_futures"


def test_refus_statut_inconnu(responsable, un_employe):
    hier = (date.today() - timedelta(days=1)).isoformat()
    reponse = responsable.post(
        "/pointages",
        json={
            "employe_id": un_employe["id"],
            "jour": hier,
            "statut": "factice",
        },
    )
    assert reponse.status_code == 422


def test_recap_du_mois(responsable, un_employe):
    hier = (date.today() - timedelta(days=1)).isoformat()
    mois = hier[:7]
    responsable.post(
        "/pointages",
        json={
            "employe_id": un_employe["id"],
            "jour": hier,
            "statut": "present",
            "arrivee": "08:00",
            "depart": "17:00",
        },
    )
    reponse = responsable.get(f"/recap?periode={mois}")
    assert reponse.status_code == 200
    ligne = next(
        un for un in reponse.json()["lignes"] if un["employe_id"] == un_employe["id"]
    )
    assert ligne["presents"] == 1
    assert ligne["heures"] == 9.0
    assert len(ligne["code"]) == 10


def test_recap_periode_invalide(responsable):
    reponse = responsable.get("/recap?periode=2026-13")
    assert reponse.status_code == 422


def test_bulletin_par_code(responsable, un_employe):
    hier = (date.today() - timedelta(days=1)).isoformat()
    mois = hier[:7]
    responsable.post(
        "/pointages",
        json={
            "employe_id": un_employe["id"],
            "jour": hier,
            "statut": "present",
            "arrivee": "08:00",
            "depart": "17:00",
        },
    )
    ligne = next(
        un
        for un in responsable.get(f"/recap?periode={mois}").json()["lignes"]
        if un["employe_id"] == un_employe["id"]
    )
    code = ligne["code"]

    # Le bulletin se lit sans compte.
    public = responsable.get(f"/public/bulletins/{code}")
    assert public.status_code == 200
    corps = public.json()
    assert corps["valide"] is True
    assert corps["nom"] == un_employe["nom"]
    assert corps["heures"] == 9.0

    inconnu = responsable.get("/public/bulletins/ZZZZZZZZZZ")
    assert inconnu.status_code == 404


def test_employe_fiche(responsable, un_employe):
    patch = responsable.patch(
        f"/employes/{un_employe['id']}",
        json={"service": "magasin", "note": "arrive tôt le lundi"},
    )
    assert patch.status_code == 200
    assert patch.json()["service"] == "magasin"


def test_agent_ne_cloture_pas(responsable, agent):
    """L'agent pointe, mais ne touche pas aux fiches ni aux comptes."""
    reponse = agent.post(
        "/comptes",
        json={
            "nom": "Intrus",
            "email": "intrus@horizon.cm",
            "mot_de_passe": "motdepasse123",
            "role": "agent",
        },
    )
    assert reponse.status_code == 403

    fiches = agent.get("/employes")
    assert fiches.status_code == 200
    ajout = agent.post(
        "/employes",
        json={"nom": "Test Agent", "telephone": "", "service": "", "note": ""},
    )
    assert ajout.status_code == 200


def test_exports(responsable):
    for chemin in ("/exports/employes.csv", "/exports/pointages.csv"):
        reponse = responsable.get(chemin)
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]
        assert reponse.text.startswith("﻿")


def test_le_pointage_kiosque_par_code(client, responsable, un_employe):
    """L'écran partagé : code, arrivée, départ - sans compte."""
    code = un_employe["code_pointage"]
    assert code and len(code) == 8

    ecran = client.get("/public/pointage")
    assert ecran.status_code == 200
    assert ecran.json()["entreprise"]["nom"]

    arrivee = client.post(
        "/public/pointage", json={"code": code.lower(), "geste": "arrivee"}
    )
    assert arrivee.status_code == 201, arrivee.text
    corps = arrivee.json()
    assert corps["ok"] is True
    assert corps["employe"] == un_employe["nom"]
    assert corps["arrivee"]

    # Le départ complète la même journée, pas une seconde ligne.
    depart = client.post(
        "/public/pointage", json={"code": code, "geste": "depart"}
    )
    assert depart.status_code == 201
    assert depart.json()["depart"]

    # La ligne est visible au comptoir, notée « kiosque ».
    equipe = responsable.get("/pointage?jour=" + corps["jour"]).json()["equipe"]
    ligne = next(
        un for un in equipe if un["employe_id"] == un_employe["id"]
    )
    assert ligne["arrivee"] == corps["arrivee"]
    assert ligne["depart"] == depart.json()["depart"]

    # Un code inventé est refusé sans rien dire de plus.
    faux = client.post(
        "/public/pointage", json={"code": "ZZZZZZZZ", "geste": "arrivee"}
    )
    assert faux.status_code == 404
    assert faux.json()["detail"]["code"] == "code_inconnu"
