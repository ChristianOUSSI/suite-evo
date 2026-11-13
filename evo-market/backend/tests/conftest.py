import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_market_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_MARKET_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_MARKET_SEED_DEMO"] = "true"
os.environ["EVO_MARKET_DEMO_MODE"] = "true"
os.environ["EVO_MARKET_JWT_SECRET"] = "test-secret-market-uniquement-pour-pytest"

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
def annonce_test(agent):
    from uuid import uuid4

    reponse = agent.post(
        "/annonces",
        json={
            "titre": f"Produit test {uuid4().hex[:6]}",
            "categorie": "alimentation",
            "prix": 25000,
            "stock": 5,
            "quartier": "Akwa",
            "vendeur_nom": "M. Test",
            "vendeur_telephone": "677112233",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()
