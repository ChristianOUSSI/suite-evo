import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_tontine_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_TONTINE_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_TONTINE_SEED_DEMO"] = "true"
os.environ["EVO_TONTINE_DEMO_MODE"] = "true"
os.environ["EVO_TONTINE_JWT_SECRET"] = "test-secret-cercle-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

TRESORIERE = {"email": "tresoriere@njangi.cm", "mot_de_passe": "Tontine2026!"}


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
def cercle(client):
    reponse = client.post("/auth/login", json=TRESORIERE)
    assert reponse.status_code == 200, reponse.text
    return client
