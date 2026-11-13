import os
import sys
from pathlib import Path

import pytest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "palabre_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["PALABRE_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["PALABRE_SEED_DEMO"] = "true"
os.environ["PALABRE_DEMO_MODE"] = "true"
os.environ["PALABRE_JWT_SECRET"] = "test-secret-palabre-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


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
    response = client.post(
        "/auth/login",
        json={"email": "patron@nanafils.cm", "password": "Palabre2026!"},
    )
    assert response.status_code == 200, response.text
    return client
