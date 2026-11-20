import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_shop_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_SHOP_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_SHOP_SEED_DEMO"] = "true"
os.environ["EVO_SHOP_DEMO_MODE"] = "true"
os.environ["EVO_SHOP_JWT_SECRET"] = "test-secret-shop-uniquement-pour-pytest-suite-evo-2026-pad"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.seed import CAISSIER, RESPONSABLE

RESP = {"email": RESPONSABLE["email"], "mot_de_passe": RESPONSABLE["mot_de_passe"]}
CAIS = {"email": CAISSIER["email"], "mot_de_passe": CAISSIER["mot_de_passe"]}


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
def caissier():
    return ouvre_compte(CAIS)


@pytest.fixture
def produit_test(responsable):
    from uuid import uuid4

    reponse = responsable.post(
        "/produits",
        json={
            "nom": f"Article {uuid4().hex[:8]}",
            "unite": "piece",
            "prix_achat": 1000,
            "prix_vente": 2000,
            "stock": 10,
            "seuil_alerte": 2,
            "note": "",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()
