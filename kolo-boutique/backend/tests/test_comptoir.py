"""Le comptoir : la séance, la dictée, le stock, le bénéfice et le tiroir du soir."""


def lire(reponse, attendu=200):
    assert reponse.status_code == attendu, reponse.text
    if reponse.status_code == 204:
        return None
    return reponse.json()


def test_sante_declare_la_simulation(client):
    data = lire(client.get("/health"))
    assert data["status"] == "ok"
    assert data["demo"] is True
    assert "WhatsApp" in data["envoi"]


def test_seance_sinstalle_puis_se_ferme(client):
    refus = client.post(
        "/auth/login",
        json={"email": "tenanciere@tchuentecahier.cm", "mot_de_passe": "mauvais"},
    )
    assert refus.status_code == 401

    entree = client.post("/auth/login", json=_connexion())
    data = lire(entree)
    assert data["user"]["role"] == "tenancier"
    assert data["user"]["role_label"] == "Tenancier"
    assert data["boutique"]["quartier"] == "Ndokoti"
    assert data["boutique"]["abonnement_hebdo_label"].startswith("3")
    jeton = entree.headers.get("set-cookie", "")
    assert "kolo_session=" in jeton
    assert "HttpOnly" in jeton

    moi = lire(client.get("/auth/me"))
    assert moi["user"]["email"] == "tenanciere@tchuentecahier.cm"

    lire(client.post("/auth/logout"), 204)
    lire(client.get("/auth/me"), 401)


def test_le_tableau_tient_le_chiffre_et_la_marge(connected):
    data = lire(connected.get("/tableau"))
    assert data["chiffre"] >= 0
    assert data["benefice"] <= data["chiffre"]
    assert 0 <= data["marge"] <= 100
    assert len(data["serie"]) == 7
    assert data["reserve"] > 0
    assert data["a_racheter"] == data["a_racheter"][:8]


def test_une_dictee_devient_une_vente_et_une_entree(connected):
    avant = lire(connected.get("/ventes?jours=1"))
    produit = _produit_nomme(connected, "fanta")

    vente = lire(
        connected.post("/dictee", json={"phrase": "2 fanta 900 momo"})
    )
    assert vente["ecrite"] is True
    assert vente["verbe"] == "vente"
    assert vente["quantite"] == 2
    assert vente["prix"] == 900
    assert vente["mode"] == "momo_mtn"
    assert vente["ecriture"]["ecriture"] == "vente"

    apres = lire(connected.get("/ventes?jours=1"))
    assert apres["total"] == avant["total"] + 1
    assert apres["chiffre"] == avant["chiffre"] + 1800

    stock_apres = _produit_nomme(connected, "fanta")
    assert stock_apres["stock"] == produit["stock"] - 2

    entree = lire(connected.post("/dictee", json={"phrase": "rachat 10 fanta 700"}))
    assert entree["verbe"] == "entree"
    assert _produit_nomme(connected, "fanta")["stock"] == stock_apres["stock"] + 10


def test_la_dictee_ne_devine_jamais_un_article_inconnu(connected):
    refus = connected.post("/dictee", json={"phrase": "3 pneu 50000"})
    assert refus.status_code == 422
    assert "Aucun article" in refus.json()["detail"]


def test_la_dictee_rende_les_mains_sur_le_stock(connected):
    produit = _produit_nomme(connected, "lampadaire")
    phrase = f"{produit['stock'] + 5} lampadaire 4000"
    doute = lire(connected.post("/dictee/analyse", json={"phrase": phrase}))
    assert doute["doute"]
    assert "Il reste" in doute["doute"]

    refus = connected.post("/dictee", json={"phrase": phrase})
    assert refus.status_code == 422


def test_une_entree_remelange_le_cout_moyen(connected):
    produit = _produit_nomme(connected, "spaghetti")
    entree = lire(
        connected.post(
            "/entrees",
            json={
                "produit_id": produit["id"],
                "quantite": 10,
                "cout_unitaire": produit["prix_achat"] + 100,
            },
        )
    )
    melange = entree["produit"]
    assert melange["prix_achat"] > produit["prix_achat"]
    assert melange["stock"] == produit["stock"] + 10

    # Le coût d'un article encore en réserve ne se corrige pas à la main.
    refus = connected.patch(
        f"/produits/{melange['id']}",
        json=_correction(melange, prix_achat=melange["prix_achat"] - 50),
    )
    assert refus.status_code == 422


def test_une_vente_rayee_remets_la_marchandise_en_reserve(connected):
    produit = _produit_nomme(connected, "eau")
    vente = lire(
        connected.post(
            "/ventes",
            json={"produit_id": produit["id"], "quantite": 2, "mode": "especes"},
        )
    )
    apres_vente = vente["produit"]["stock"]
    assert apres_vente == produit["stock"] - 2

    rayee = lire(
        connected.post(
            f"/ventes/{vente['vente']['id']}/annuler",
            json={"motif": "le client s'est ravisé"},
        )
    )
    assert rayee["vente"]["annule"] is True
    assert rayee["produit"]["stock"] == apres_vente + 2


def test_une_depense_de_transport_trouve_sa_categorie(connected):
    ligne = lire(
        connected.post(
            "/dictee", json={"phrase": "dépense taxi au dépôt 1500"}
        )
    )
    assert ligne["verbe"] == "depense"
    assert ligne["categorie"] == "transport"
    assert ligne["prix"] == 1500


def test_le_tiroir_compte_du_soir_ecrit_l_ecart(connected):
    caisse = lire(connected.get("/caisse"))
    compte = caisse["attendu"] + 200
    declare = lire(
        connected.post("/caisse/declarer", json={"compte": compte, "fond": 5000})
    )
    assert declare["attendu"] == caisse["attendu"]
    assert declare["ecart"] == 200
    assert declare["tenu"] is False

    relit = lire(connected.get("/caisse"))
    assert relit["comptage"]["id"] == declare["id"]


def test_une_feuille_csv_se_telecharge_en_francais(connected):
    rep = connected.get("/exports/ventes.csv?jours=30")
    assert rep.status_code == 200
    assert rep.headers["content-type"].startswith("text/csv")
    assert "attachment" in rep.headers["content-disposition"]
    texte = rep.content.decode("utf-8-sig")
    assert texte.startswith("Repère;Jour;")
    assert ";" in texte


def test_un_rail_coupe_refuse_la_vente(connected):
    boutique = lire(connected.put("/boutique", json=_boutique(orange=False)))
    assert boutique["orange_actif"] is False
    refus = connected.post(
        "/ventes", json={"produit_id": 1, "quantite": 1, "mode": "momo_orange"}
    )
    assert refus.status_code == 422
    assert "Orange Money" in refus.json()["detail"]


def _connexion():
    return {"email": "tenanciere@tchuentecahier.cm", "mot_de_passe": "Kolodo2026!"}


def _produit_nomme(client, mot):
    cahier = lire(client.get(f"/produits?motif={mot}"))
    assert cahier["total"] >= 1, cahier
    return cahier["produits"][0]


def _correction(produit, prix_achat):
    return {
        "nom": produit["nom"],
        "categorie": produit["categorie"],
        "unite": produit["unite"],
        "prix_achat": prix_achat,
        "prix_vente": produit["prix_vente"],
        "stock": produit["stock"],
        "alerte_stock": produit["alerte_stock"],
        "mots_cles": produit["mots_cles"],
    }


def _boutique(orange):
    return {
        "nom": "Alimentation Générale Tchuenté",
        "enseigne": "Tchuenté",
        "quartier": "Ndokoti",
        "ville": "Douala",
        "tenancier": "Brigitte Tchuenté",
        "telephone": "+237699104522",
        "abonnement_hebdo": 3000,
        "especes_actifs": True,
        "momo_actif": True,
        "orange_actif": orange,
        "credit_accorde": False,
        "note": "",
    }
