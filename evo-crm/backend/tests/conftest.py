import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_crm_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_CRM_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_CRM_SEED_DEMO"] = "true"
os.environ["EVO_CRM_DEMO_MODE"] = "true"
os.environ["EVO_CRM_JWT_SECRET"] = "test-secret-carnet-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.seed import RESPONSABLE, VENDEUR

RESPONSABLE = {"email": RESPONSABLE["email"], "mot_de_passe": RESPONSABLE["mot_de_passe"]}
VENDEUR = {"email": VENDEUR["email"], "mot_de_passe": VENDEUR["mot_de_passe"]}


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
def carnet(client):
    """La maison ouvre son carnet par le compte qui tient tout."""
    reponse = client.post("/auth/login", json=RESPONSABLE)
    assert reponse.status_code == 200, reponse.text
    return client


@pytest.fixture
def vendeur(client):
    reponse = client.post("/auth/login", json=VENDEUR)
    assert reponse.status_code == 200, reponse.text
    return client
