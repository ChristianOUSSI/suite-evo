"""Le carnet : la séance, la fiche, le journal, la relance, les droits."""

from datetime import date, timedelta


def lire(reponse, attendu=200):
    assert reponse.status_code == attendu, reponse.text
    if reponse.status_code == 204:
        return None
    return reponse.json()


def client_par_nom(carnet, nom):
    for un in lire(carnet.get("/clients"))["clients"]:
        if un["nom"] == nom:
            return un
    raise AssertionError(f"client introuvable : {nom}")


def nouveau_client(carnet, nom, **sur):
    corps = {
        "nom": nom,
        "telephone": sur.get("telephone", "+237699000000"),
        "quartier": sur.get("quartier", "Mboppi"),
        "segment": sur.get("segment", "particulier"),
        "note": sur.get("note", ""),
    }
    return lire(carnet.post("/clients", json=corps))


def test_la_sante_annonce_la_langue_et_la_simulation(client):
    data = lire(client.get("/health"))
    assert data["status"] == "ok"
    assert data["demo"] is True
    assert data["langues"] == ["fr", "en"]
    assert "aucun SMS" in data["envoi"]


def test_la_seance_sinstalle_puis_se_ferme(client):
    refus = client.post("/auth/login", json={"email": "kelly@etsmama.cm", "mot_de_passe": "paslebon"})
    assert refus.status_code == 401
    corps = refus.json()["detail"]
    assert corps["code"] == "identifiants"
    assert corps["fr"] and corps["en"] and corps["fr"] != corps["en"]

    entree = client.post("/auth/login", json={"email": "KELLY@etsmama.cm", "mot_de_passe": "Carnet2026!"})
    data = lire(entree)
    assert data["user"]["role"] == "responsable"
    assert data["entreprise"]["quartier"] == "Mboppi"
    # L'adresse se stocke en minuscules : deux majuscules ne font pas deux comptes.
    assert data["user"]["email"] == "kelly@etsmama.cm"

    jeton = entree.headers.get("set-cookie", "")
    assert "evo_crm_session=" in jeton
    assert "HttpOnly" in jeton

    lire(client.post("/auth/logout"), 204)
    lire(client.get("/auth/me"), 401)


def test_une_seance_perdue_parle_deux_langues(client):
    """Le 401 est la réponse la plus fréquente d'une API : elle aussi doit être bilingue."""
    refus = client.get("/etat")
    assert refus.status_code == 401
    corps = refus.json()["detail"]
    assert corps["code"] == "seance_expiree"
    assert corps["fr"] and corps["en"]


def test_une_saisie_refusee_parle_deux_langues(client):
    rep = client.post("/auth/login", json={"email": "kelly@etsmama.cm", "mot_de_passe": "court"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert corps["code"].startswith("saisie.")
    assert "mot de passe" in corps["fr"]
    assert "password" in corps["en"]


def test_un_numero_invalide_refuse_dans_les_deux_langues(carnet):
    rep = carnet.post("/clients", json={"nom": "Client Sans Format", "telephone": "07 12"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert "camerounais" in corps["fr"].lower(), corps
    assert "Cameroonian" in corps["en"], corps
    assert corps["fr"] != corps["en"]


def test_le_telephone_se_canonise_a_l_entree(carnet):
    client = nouveau_client(carnet, "Aïcha Doulla", telephone="00237 655 44 33 22")
    assert client["telephone"] == "+237655443322"
    assert client["joignable"] is True

    sans = nouveau_client(carnet, "Anonyme Sans Fil", telephone="")
    assert sans["telephone"] == ""
    assert sans["joignable"] is False


def test_un_meme_numero_ne_fait_pas_deux_fiches(carnet):
    nouveau_client(carnet, "Premier Dupont", telephone="+237671220044")
    rep = carnet.post("/clients", json={"nom": "Second Dupont", "telephone": "671 22 00 44"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert corps["code"] == "meme_telephone"
    assert corps["fr"] != corps["en"]


def test_etat_ne_rend_que_des_nombres(carnet):
    """Ni phrase ni montant formaté : la langue se décide à l'écran."""
    etat = lire(carnet.get("/etat"))
    assert etat["clients"] >= 14
    assert etat["actifs"] < etat["clients"], "un client sorti du carnet doit rester compté"
    assert etat["joignables"] < etat["actifs"], "le client sans numéro ne doit pas être compté joignable"
    for cle in ("clients", "actifs", "joignables", "relances_dues", "silencie"):
        assert isinstance(etat[cle], int), cle
    assert "FCFA" not in str(etat)
    assert set(etat["segments"]) == {"particulier", "revendeur", "grossiste", "institution"}


def test_un_devis_ouvre_une_reprise(carnet):
    client = nouveau_client(carnet, "Béni Devis", telephone="+237688112244")
    rappel = lire(carnet.get("/entreprise"))["rappel_jours"]

    lire(
        carnet.post(
            f"/clients/{client['id']}/echanges",
            json={"type": "devis", "montant": 45_000},
        )
    )
    fiche = lire(carnet.get(f"/clients/{client['id']}"))
    assert fiche["relance"] is not None
    assert fiche["relance"]["origine"] == "devis"
    assert fiche["relance"]["motif"] == "", "aucune phrase n'est stockée pour une relance automatique"
    attendu = date.today() + timedelta(days=rappel)
    assert fiche["relance"]["due_le"] == attendu.isoformat()

    # Un second devis ne double pas la reprise.
    lire(carnet.post(f"/clients/{client['id']}/echanges", json={"type": "devis"}))
    relances = [un for un in lire(carnet.get(f"/clients/{client['id']}"))["relances"] if un["statut"] == "a_faire"]
    assert len(relances) == 1


def test_un_silence_designe_qu_il_faut_reprendre(carnet):
    seuil = lire(carnet.get("/entreprise"))["silence_jours"]
    forgettes = lire(carnet.get("/silencie"))
    assert forgettes["seuil"] == seuil
    noms = [un["nom"] for un in forgettes["clients"]]
    assert "Bella Chéride" in noms, noms
    assert "Résidence Bonanjo" not in noms, "sans numéro, rien à rappeler"
    for un in forgettes["clients"]:
        assert un["derniers_jours"] is None or un["derniers_jours"] >= seuil


def test_une_relance_se_clot_et_ne_se_clot_deux_fois(carnet):
    client = nouveau_client(carnet, "Christelle Retard", telephone="+237694556677")
    relance = lire(
        carnet.post(
            f"/clients/{client['id']}/relances",
            json={"motif": "Apporter la palette", "due_le": (date.today() - timedelta(days=2)).isoformat()},
        )
    )
    assert relance["retard"] == 2

    dues = lire(carnet.get("/relances"))["du_jour"]
    assert [un["id"] for un in dues].count(relance["id"]) == 1
    assert any(un["id"] == relance["id"] for un in lire(carnet.get("/relances"))["en_retard"])

    close = lire(carnet.post(f"/relances/{relance['id']}/terminer", json={}))
    assert close["statut"] == "faite"
    assert close["faite_le"] == date.today().isoformat()

    rep = carnet.post(f"/relances/{relance['id']}/terminer", json={})
    assert rep.status_code == 422
    assert rep.json()["detail"]["code"] == "relance_deja_faite"

    assert relance["id"] not in [un["id"] for un in lire(carnet.get("/relances"))["du_jour"]]


def test_une_relance_sans_raison_n_est_pas_prise(carnet):
    client = nouveau_client(carnet, "Didier Motif", telephone="+237670123987")
    rep = carnet.post(f"/clients/{client['id']}/relances", json={"motif": "   "})
    assert rep.status_code == 422
    assert rep.json()["detail"]["code"] == "relance_sans_motif"


def test_une_relance_ne_remonte_pas_dans_le_passe(carnet):
    client = nouveau_client(carnet, "Elise Reprogramme", telephone="+237669887700")
    relance = lire(
        carnet.post(f"/clients/{client['id']}/relances", json={"motif": "Repasser demain"})
    )
    rep = carnet.put(
        f"/relances/{relance['id']}",
        json={"due_le": (date.today() - timedelta(days=1)).isoformat()},
    )
    assert rep.status_code == 422
    assert "passé" in rep.json()["detail"]["fr"]

    decale = lire(carnet.put(f"/relances/{relance['id']}", json={"due_le": (date.today() + timedelta(days=3)).isoformat()}))
    assert decale["due_le"] == (date.today() + timedelta(days=3)).isoformat()


def test_un_client_sorti_n_accepte_plus_rien(carnet):
    sortie = next(un for un in lire(carnet.get("/clients"))["clients"] if not un["actif"])
    rep = carnet.post(f"/clients/{sortie['id']}/echanges", json={"type": "appel"})
    assert rep.status_code == 422
    assert rep.json()["detail"]["code"] == "client_sorti"


def test_un_type_echange_inconnu_est_refuse(carnet):
    """Le pont de validation ne doit imposer aucune langue dans l'autre corps."""
    client = nouveau_client(carnet, "Franck Typographe", telephone="+237655112299")
    rep = carnet.post(f"/clients/{client['id']}/echanges", json={"type": "carrier-pigeon"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert corps["code"].startswith("saisie.")
    assert "type d'échange" in corps["fr"]
    assert "log type" in corps["en"]
    assert corps["fr"] != corps["en"]

    rep = carnet.post("/clients", json={"nom": "Georgette Segment", "segment": "revendeuse"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert "particulier" in corps["fr"] and "institution" in corps["en"]


def test_le_vendeur_ne_change_pas_le_carnet_de_la_maison(vendeur):
    entreprise = lire(vendeur.get("/entreprise"))
    rep = vendeur.put("/entreprise", json={**entreprise, "silence_jours": 20})
    assert rep.status_code == 403
    assert rep.json()["detail"]["code"] == "droits"

    clients = lire(vendeur.get("/clients"))["clients"]
    cible = next(un for un in clients if un["actif"])
    rep = vendeur.patch(f"/clients/{cible['id']}", json={"actif": False})
    assert rep.status_code == 403

    # Mais il écrit dans le journal : c'est son travail.
    lire(vendeur.post(f"/clients/{cible['id']}/echanges", json={"type": "appel", "note": "Appel du matin"}))


def test_une_note_en_formule_ne_sort_pas_en_formule(carnet):
    client = nouveau_client(carnet, "Ghislain Piégé", telephone="+237698774411")
    lire(
        carnet.post(
            f"/clients/{client['id']}/echanges",
            json={"type": "appel", "note": "=1+1+cmd()"},
        )
    )
    feuille = carnet.get("/exports/echanges.csv")
    assert feuille.status_code == 200
    texte = feuille.content.decode("utf-8-sig")
    assert "'=1+1+cmd()" in texte


def test_les_feuilles_csv_sortent_en_separant_par_point_virgule(carnet):
    for chemin, entete in (
        ("/exports/clients.csv", "id;nom;telephone;"),
        ("/exports/echanges.csv", "client;telephone;type;"),
        ("/exports/relances.csv", "client;telephone;motif;origine;"),
    ):
        rep = carnet.get(chemin)
        assert rep.status_code == 200, chemin
        assert rep.headers["content-type"].startswith("text/csv")
        assert "attachment" in rep.headers["content-disposition"]
        assert rep.content[:3] == b"\xef\xbb\xbf", "sans BOM, Excel ouvre les accents en charabia"
        assert rep.content.decode("utf-8-sig").startswith(entete), chemin


def test_la_recherche_tient_sur_un_seul_champ(carnet):
    lignes = lire(carnet.get("/clients?texte=mboppi"))["clients"]
    assert lignes, "le quartier se cherche aussi"
    par_segment = lire(carnet.get("/clients?segment=grossiste"))["clients"]
    assert all(un["segment"] == "grossiste" for un in par_segment)
    assert par_segment, "le semis porte au moins un grossiste"


def test_un_client_inconnu_renvoie_un_refus_bilingue(carnet):
    rep = carnet.get("/clients/987654")
    assert rep.status_code == 404
    corps = rep.json()["detail"]
    assert corps["code"] == "client_inconnu"
    assert corps["fr"] != corps["en"]
