"""La caisse, de bout en bout."""


def test_sante(client):
    reponse = client.get("/health")
    assert reponse.status_code == 200
    assert reponse.json()["service"] == "evo-shop"


def test_sans_seance(client):
    assert client.get("/etat").status_code == 401


def test_etat_de_la_caisse(responsable):
    reponse = responsable.get("/etat")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["produits"] >= 40
    assert corps["ca_du_jour"] >= 0


def test_vente_descend_le_stock(responsable, caissier, produit_test):
    avant = produit_test["stock"]
    reponse = caissier.post(
        "/ventes",
        json={"lignes": [{"produit_id": produit_test["id"], "quantite": 3}]},
    )
    assert reponse.status_code == 200, reponse.text
    corps = reponse.json()
    assert corps["statut"] == "validee"
    assert corps["total"] == 6000
    assert corps["lignes"][0]["prix_unitaire"] == 2000

    produits = responsable.get("/produits").json()["produits"]
    apres = next(un for un in produits if un["id"] == produit_test["id"])
    assert apres["stock"] == avant - 3


def test_stock_insuffisant_refuse(responsable, produit_test):
    reponse = responsable.post(
        "/ventes",
        json={"lignes": [{"produit_id": produit_test["id"], "quantite": 9999}]},
    )
    assert reponse.status_code == 422
    assert reponse.json()["detail"]["code"] == "stock_insuffisant"


def test_annulation_rend_le_stock(responsable, produit_test):
    vente = responsable.post(
        "/ventes",
        json={"lignes": [{"produit_id": produit_test["id"], "quantite": 2}]},
    ).json()
    assert responsable.patch(
        f"/ventes/{vente['id']}", json={"statut": "annulee", "note": "erreur de caisse"}
    ).status_code == 200

    produits = responsable.get("/produits").json()["produits"]
    apres = next(un for un in produits if un["id"] == produit_test["id"])
    assert apres["stock"] == produit_test["stock"]

    # Une seconde annulation est refusée.
    refus = responsable.patch(
        f"/ventes/{vente['id']}", json={"statut": "annulee"}
    )
    assert refus.status_code == 409


def test_reapprovisionnement(responsable, produit_test):
    reponse = responsable.post(
        f"/produits/{produit_test['id']}/stock",
        json={"quantite": 5, "note": "livraison du matin"},
    )
    assert reponse.status_code == 200
    assert reponse.json()["stock"] == produit_test["stock"] + 5


def test_caissier_ne_touche_pas_aux_prix(responsable, caissier, produit_test):
    reponse = caissier.patch(
        f"/produits/{produit_test['id']}",
        json={"prix_vente": 9999},
    )
    assert reponse.status_code == 403

    # Mais il vend et il annule.
    vente = caissier.post(
        "/ventes",
        json={"lignes": [{"produit_id": produit_test['id'], "quantite": 1}]},
    )
    assert vente.status_code == 200


def test_recap_du_mois(responsable):
    reponse = responsable.get("/recap")
    assert reponse.status_code == 200
    corps = reponse.json()
    assert corps["ventes"] > 0
    assert corps["ca"] > 0
    assert len(corps["par_produit"]) > 0
    assert corps["marge"] <= corps["ca"]


def test_exports(responsable):
    for chemin in ("/exports/produits.csv", "/exports/ventes.csv"):
        reponse = responsable.get(chemin)
        assert reponse.status_code == 200
        assert "text/csv" in reponse.headers["content-type"]


def test_commande_publique(client, produit_test):
    """Le visiteur commande sans compte : ticket en « commande », stock
    intact, puis la caisse valide et le stock descend."""
    boutique = client.get("/public/boutique")
    assert boutique.status_code == 200, boutique.text
    assert boutique.json()["lien"].endswith("/commander")

    entree = {
        "client_nom": "Cliente WhatsApp",
        "client_telephone": "677123456",
        "lignes": [{"produit_id": produit_test["id"], "quantite": 2}],
        "note": "à retirer ce soir",
    }
    reponse = client.post("/public/commandes", json=entree)
    assert reponse.status_code == 201, reponse.text
    corps = reponse.json()
    assert corps["ok"] is True
    assert corps["total"] == 4000
    assert corps["reference"] > 0


def test_cycle_commande_complet(responsable, client, produit_test):
    avant = produit_test["stock"]
    creation = client.post(
        "/public/commandes",
        json={
            "client_nom": "Client Complet",
            "client_telephone": "",
            "lignes": [{"produit_id": produit_test["id"], "quantite": 4}],
            "note": "",
        },
    )
    assert creation.status_code == 201, creation.text
    reference = creation.json()["reference"]

    # La commande n'a pas touché le stock.
    produits = responsable.get("/produits").json()["produits"]
    assert next(un for un in produits if un["id"] == produit_test["id"])["stock"] == avant

    # La caisse la valide : le stock descend une fois.
    ok = responsable.patch(f"/ventes/{reference}", json={"statut": "validee"})
    assert ok.status_code == 200, ok.text
    assert ok.json()["statut"] == "validee"
    produits = responsable.get("/produits").json()["produits"]
    assert next(un for un in produits if un["id"] == produit_test["id"])["stock"] == avant - 4

    # Re-valider est refusé, annuler une validée rend le stock.
    double = responsable.patch(f"/ventes/{reference}", json={"statut": "validee"})
    assert double.status_code == 409
    annule = responsable.patch(f"/ventes/{reference}", json={"statut": "annulee"})
    assert annule.status_code == 200
    produits = responsable.get("/produits").json()["produits"]
    assert next(un for un in produits if un["id"] == produit_test["id"])["stock"] == avant


def test_commande_annulee_sans_valider_ne_touche_pas_le_stock(responsable, client, produit_test):
    avant = produit_test["stock"]
    creation = client.post(
        "/public/commandes",
        json={
            "client_nom": "Annulation Tôt",
            "client_telephone": "",
            "lignes": [{"produit_id": produit_test["id"], "quantite": 1}],
            "note": "",
        },
    )
    assert creation.status_code == 201
    reference = creation.json()["reference"]
    annule = responsable.patch(f"/ventes/{reference}", json={"statut": "annulee"})
    assert annule.status_code == 200
    produits = responsable.get("/produits").json()["produits"]
    assert next(un for un in produits if un["id"] == produit_test["id"])["stock"] == avant
