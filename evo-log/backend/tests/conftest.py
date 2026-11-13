import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_log_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_LOG_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_LOG_SEED_DEMO"] = "true"
os.environ["EVO_LOG_DEMO_MODE"] = "true"
os.environ["EVO_LOG_JWT_SECRET"] = "test-secret-log-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.seed import AGENT, RESPONSABLE

RESP = {"email": RESPONSABLE["email"], "mot_de_passe": RESPONSABLE["mot_de_passe"]}
AG = {"email": AGENT["email"], "mot_de_passe": AGENT["mot_de_passe"]}


def ouvre_compte(corps: dict):
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
def agent():
    return ouvre_compte(AG)


@pytest.fixture
def colis_test(agent):
    from uuid import uuid4

    reponse = agent.post(
        "/colis",
        json={
            "genre": "colis",
            "description": f"Test {uuid4().hex[:6]}",
            "poids_kg": 12,
            "expediteur_nom": "M. Test",
            "expediteur_telephone": "677112233",
            "destinataire_nom": "Mme Test",
            "destinataire_telephone": "655667788",
            "depart": "Douala",
            "arrivee": "Yaoundé",
            "frais": 15000,
            "moyen": "mtn_money",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()
