import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "cash_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["CASH_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["CASH_SEED_DEMO"] = "true"
os.environ["CASH_DEMO_MODE"] = "true"
os.environ["CASH_JWT_SECRET"] = "test-secret-caisse-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

CAISSE = {"email": "caisse@tilleuls.cm", "password": "Caisse2026!"}
DIRECTION = {"email": "direction@tilleuls.cm", "password": "Caisse2026!"}


@pytest.fixture(scope="session")
def app_client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def client(app_client):
    app_client.cookies.clear()
    yield app_client
    app_client.cookies.clear()


@pytest.fixture
def signed_in(client):
    reponse = client.post("/auth/login", json=CAISSE)
    assert reponse.status_code == 200, reponse.text
    return client


def lire(reponse, attendu=200):
    assert reponse.status_code == attendu, reponse.text
    return reponse.json()
