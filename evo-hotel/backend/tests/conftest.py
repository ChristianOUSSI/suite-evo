import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_hotel_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_HOTEL_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_HOTEL_SEED_DEMO"] = "true"
os.environ["EVO_HOTEL_DEMO_MODE"] = "true"
os.environ["EVO_HOTEL_JWT_SECRET"] = "test-secret-hotel-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.seed import ACCUEIL, RESPONSABLE

RESP = {"email": RESPONSABLE["email"], "mot_de_passe": RESPONSABLE["mot_de_passe"]}
ACC = {"email": ACCUEIL["email"], "mot_de_passe": ACCUEIL["mot_de_passe"]}


def ouvre_compte(corps: dict):
    """Un client par rôle, avec son propre bocal à cookies."""
    client = TestClient(app)
    reponse = client.post("/auth/login", json=corps)
    assert reponse.status_code == 200, reponse.text
    return client


@pytest.fixture(scope="session")
def app_client():
    with TestClient(app) as client:
        yield client


@pytest.fixture
def client(app_client):
    app_client.cookies.clear()
    yield app_client
    app_client.cookies.clear()


@pytest.fixture
def responsable():
    return ouvre_compte(RESP)


@pytest.fixture
def accueil():
    return ouvre_compte(ACC)


@pytest.fixture
def chambre_libre(responsable):
    """Une chambre de test, numérotée à part des données de démonstration."""
    from uuid import uuid4

    numero = f"T{uuid4().hex[:3].upper()}"
    reponse = responsable.post(
        "/chambres",
        json={
            "numero": numero,
            "type": "standard",
            "prix_par_nuit": 15000,
            "capacite": 2,
            "note": "",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()


@pytest.fixture
def client_test(responsable):
    from uuid import uuid4

    reponse = responsable.post(
        "/clients",
        json={
            "nom": f"Client {uuid4().hex[:8]}",
            "telephone": "",
            "piece": "",
            "note": "",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()
