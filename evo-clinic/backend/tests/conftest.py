import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_clinic_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_CLINIC_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_CLINIC_SEED_DEMO"] = "true"
os.environ["EVO_CLINIC_DEMO_MODE"] = "true"
os.environ["EVO_CLINIC_JWT_SECRET"] = "test-secret-clinic-uniquement-pour-pytest"

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
def patient_test(responsable):
    from uuid import uuid4

    reponse = responsable.post(
        "/patients",
        json={
            "nom": f"Patient {uuid4().hex[:8]}",
            "telephone": "+237677112233",
            "naissance": "1990-05-12",
            "sexe": "femme",
            "groupe": "O+",
            "allergies": "",
            "note": "",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()


@pytest.fixture
def acte_test(responsable, patient_test):
    from uuid import uuid4

    reponse = responsable.post(
        "/actes",
        json={
            "patient_id": patient_test["id"],
            "motif": f"Test {uuid4().hex[:6]}",
            "montant": 10000,
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()
