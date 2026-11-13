"""Le classeur : documents, références, échéances, vérification publique."""

from datetime import date, timedelta


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["service"] == "evo-docs"
    assert corps["langues"] == ["fr", "en"]


def test_seed_rempli(responsable):
    etat = responsable.get("/etat").json()
    assert etat["documents"] > 30
    assert etat["actifs"] > 0


def test_document_et_reference(responsable):
    aujourdhui = date.today()
    reponse = responsable.post(
        "/documents",
        json={
            "titre": "Contrat test unique",
            "categorie": "contrat",
            "emetteur": "Notaire Test",
            "date_document": aujourdhui.isoformat(),
            "echeance": (aujourdhui + timedelta(days=30)).isoformat(),
        },
    )
    assert reponse.status_code == 200, reponse.text
    document = reponse.json()
    assert document["reference"]
    assert len(document["reference"]) == 10
    assert document["statut"] == "actif"
    assert document["jours_restants"] == 30
    assert document["en_retard"] is False

    # Une date dans le futur est refusée.
    refus = responsable.post(
        "/documents",
        json={"titre": "Futur", "date_document": (aujourdhui + timedelta(days=5)).isoformat()},
    )
    assert refus.status_code == 422


def test_categorie_inconnue(responsable):
    reponse = responsable.post("/documents", json={"titre": "X", "categorie": "inconnu"})
    assert reponse.status_code == 422
    detail = reponse.json()
    assert detail["code"].startswith("saisie")
    assert detail["fr"]
    assert detail["en"]


def test_statut_et_archive(responsable, agent):
    creation = agent.post("/documents", json={"titre": "Doc à archiver", "categorie": "courrier"})
    assert creation.status_code == 200
    identifiant = creation.json()["id"]

    archive = responsable.patch(f"/documents/{identifiant}", json={"statut": "archive"})
    assert archive.status_code == 200
    assert archive.json()["statut"] == "archive"

    refus = responsable.patch(f"/documents/{identifiant}", json={"statut": "bidon"})
    assert refus.status_code == 422


def test_verification_publique_sans_compte(client, responsable):
    creation = responsable.post("/documents", json={"titre": "Doc public test", "categorie": "identite"})
    reference = creation.json()["reference"]

    client.cookies.clear()
    reponse = client.get(f"/public/verifier/{reference}")
    assert reponse.status_code == 200
    document = reponse.json()["document"]
    assert document["titre"] == "Doc public test"
    assert document["categorie"] == "identite"
    # La vérification ne montre ni émetteur ni échéance ni note.
    assert "emetteur" not in document
    assert "echeance" not in document

    inconnu = client.get("/public/verifier/Z9Z9Z9Z9Z9")
    assert inconnu.status_code == 404


def test_recap_mois(responsable):
    reponse = responsable.get("/etat").json()
    assert reponse["periode"]
    recap = responsable.get(f"/recap?periode={reponse['periode']}").json()
    assert "par_categorie" in recap
    assert "par_statut" in recap


def test_export_csv(responsable):
    reponse = responsable.get("/exports/documents.csv")
    assert reponse.status_code == 200
    assert "text/csv" in reponse.headers["content-type"]
    assert "reference" in reponse.text.splitlines()[0]


def test_agent_fait_le_quotidien_mais_pas_les_comptes(agent, responsable):
    assert agent.post("/comptes", json={"nom": "X Y", "email": "x@y.cm", "mot_de_passe": "abcdef", "role": "agent"}).status_code == 403
    assert agent.put("/organisation", json={"nom": "Autre Maison"}).status_code == 403
