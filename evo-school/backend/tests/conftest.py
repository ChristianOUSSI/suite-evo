import os
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

TEST_DB = Path(__file__).resolve().parent / "evo_school_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["EVO_SCHOOL_DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["EVO_SCHOOL_SEED_DEMO"] = "true"
os.environ["EVO_SCHOOL_DEMO_MODE"] = "true"
os.environ["EVO_SCHOOL_JWT_SECRET"] = "test-secret-school-uniquement-pour-pytest"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.seed import COMPTABLE, RESPONSABLE

RESP = {"email": RESPONSABLE["email"], "mot_de_passe": RESPONSABLE["mot_de_passe"]}
COMP = {"email": COMPTABLE["email"], "mot_de_passe": COMPTABLE["mot_de_passe"]}


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
def comptable():
    return ouvre_compte(COMP)


@pytest.fixture
def classe_test(responsable):
    from uuid import uuid4

    reponse = responsable.post(
        "/classes",
        json={"nom": f"Test {uuid4().hex[:6]}", "titulaire": "", "frais_annuels": 40000, "note": ""},
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()


@pytest.fixture
def eleve_test(responsable, classe_test):
    from uuid import uuid4

    reponse = responsable.post(
        "/eleves",
        json={
            "classe_id": classe_test["id"],
            "nom": f"Élève {uuid4().hex[:8]}",
            "matricule": f"T-{uuid4().hex[:8]}",
            "parent_nom": "",
            "parent_telephone": "",
            "frais_attendu": 40000,
            "note": "",
        },
    )
    assert reponse.status_code == 200, reponse.text
    return reponse.json()
