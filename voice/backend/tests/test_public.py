from datetime import datetime, timedelta

from app.utils import utcnow


def test_guichets_publics_sans_compte(client):
    reponse = client.get("/public/services")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert "guichets" in corps and "organisation" in corps
    assert isinstance(corps["guichets"], list)


def test_reservation_publique_puis_refus_du_passe(client):
    guichets = client.get("/public/services").json()["guichets"]
    assert guichets, "la démo doit semer au moins un guichet"
    guichet = guichets[0]
    creneau = guichet["creneaux"][0] if guichet["creneaux"] else None
    assert creneau, "le guichet doit proposer des créneaux"

    corps = {
        "service_id": guichet["id"],
        "caller_name": "Maman Essomba",
        "caller_phone": "699112233",
        "starts_at": creneau,
        "note": "",
    }
    pose = client.post("/public/appointments", json=corps)
    assert pose.status_code == 201, pose.text
    assert pose.json()["reference"].startswith("RDV")

    # Le même créneau est désormais pris : le second dépôt est refusé.
    doublon = client.post("/public/appointments", json=corps)
    assert doublon.status_code == 422

    # Une date passée est refusée aussi.
    hier = (utcnow() - timedelta(days=2)).isoformat()
    passe = client.post(
        "/public/appointments",
        json={**corps, "caller_name": "Autre Maman", "starts_at": hier},
    )
    assert passe.status_code == 422


def test_service_inconnu_refuse(client):
    reponse = client.post(
        "/public/appointments",
        json={
            "service_id": 99999,
            "caller_name": "Test Test",
            "caller_phone": "699000000",
            "starts_at": datetime.now().isoformat(),
        },
    )
    assert reponse.status_code == 404
