"""Le cercle : la séance, le tirage revérifiable, la cotisation, la remise."""

import hashlib


def lire(reponse, attendu=200):
    assert reponse.status_code == attendu, reponse.text
    if reponse.status_code == 204:
        return None
    return reponse.json()


def tour_ouvert(cercle):
    """Le tour en cours, ou un nouveau. Les tests ne se marchent pas dessus."""
    courant = lire(cercle.get("/etat"))["tour_courant"]
    if courant is not None and courant["statut"] == "en_cours":
        return courant
    return lire(cercle.post("/tours", json={}))


def part_due(cercle, tour_id):
    for membre in lire(cercle.get(f"/membres?tour_id={tour_id}"))["membres"]:
        if membre["actif"] and membre["reste"] > 0:
            return membre
    raise AssertionError("aucune part due sur ce tour")


def test_la_sante_annonce_la_langue_et_la_simulation(client):
    data = lire(client.get("/health"))
    assert data["status"] == "ok"
    assert data["demo"] is True
    assert data["langues"] == ["fr", "en"]
    assert "MoMo" in data["envoi"]


def test_la_seance_sinstalle_puis_se_ferme(client):
    refus = client.post(
        "/auth/login", json={"email": "tresoriere@njangi.cm", "mot_de_passe": "paslebon"}
    )
    assert refus.status_code == 401
    corps = refus.json()["detail"]
    # Un refus doit se lire dans les deux langues, pas seulement en français.
    assert corps["code"] == "identifiants"
    assert "fr" in corps and "en" in corps

    entree = client.post(
        "/auth/login", json={"email": "tresoriere@njangi.cm", "mot_de_passe": "Tontine2026!"}
    )
    data = lire(entree)
    assert data["user"]["role"] == "tresorier"
    assert data["groupe"]["quartier"] == "Ndokoti"
    assert data["groupe"]["cotisation"] == 10_000
    jeton = entree.headers.get("set-cookie", "")
    assert "evo_tontine_session=" in jeton
    assert "HttpOnly" in jeton

    moi = lire(client.get("/auth/me"))
    assert moi["user"]["email"] == "tresoriere@njangi.cm"

    lire(client.post("/auth/logout"), 204)
    lire(client.get("/auth/me"), 401)


def test_une_saisie_refusee_parle_deux_langues(client):
    """Le pont de validation : un 422 de Pydantic arrive traduit."""
    rep = client.post("/auth/login", json={"email": "tresoriere@njangi.cm", "mot_de_passe": "court"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert corps["code"].startswith("saisie.")
    assert corps["fr"] and corps["en"]
    assert corps["fr"] != corps["en"]


def test_un_rythme_inconnu_nimpose_pas_le_francais(cercle):
    """La liste des rythmes se nomme de la même façon dans les deux langues."""
    entreprise = lire(cercle.get("/groupe"))
    rep = cercle.put("/groupe", json={**entreprise, "frequence": "annuel"})
    assert rep.status_code == 422
    corps = rep.json()["detail"]
    assert "hebdo" in corps["fr"] and "hebdo" in corps["en"]
    assert corps["fr"].startswith("le rythme")
    assert corps["en"].startswith("the frequency")

    numero = cercle.post("/membres", json={"nom": "Numéro tordu", "telephone": "12 34"})
    assert numero.status_code == 422
    corps = numero.json()["detail"]
    assert "camerounais" in corps["fr"].lower()
    assert "Cameroonian" in corps["en"]


def test_le_pot_se_calcule_sur_les_parts(cercle):
    etat = lire(cercle.get("/etat"))
    membres = lire(cercle.get("/membres"))
    assert membres["parts"] == sum(un["part"] for un in membres["membres"] if un["actif"])
    assert membres["pot"] == 10_000 * membres["parts"]
    assert etat["membres"] == membres["actifs"]
    assert etat["pot_attendu"] == membres["pot"]


def test_le_tirage_se_reverifie_avec_la_graine(cercle):
    tour = tour_ouvert(cercle)
    tirage = lire(cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": ""}))
    assert tirage["statut"] == "tire"
    assert tirage["gagnant"]

    # N'importe quel membre peut refaire le calcul chez lui.
    index = int(hashlib.sha256(tirage["graine"].encode()).hexdigest(), 16) % tirage["taille"]
    assert index == tirage["verifier"]["index"]

    membres = lire(cercle.get("/membres"))["membres"]
    actifs = sorted([un for un in membres if un["actif"]], key=lambda un: (un["nom"], un["id"]))
    assert actifs[index]["nom"] == tirage["gagnant"]

    # Et un tour déjà tiré ne se retire pas.
    refus = cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": "autre"})
    assert refus.status_code == 422
    assert refus.json()["detail"]["code"] == "deja_tire"


def test_une_part_entree_reduit_ce_qui_reste(cercle):
    tour = tour_ouvert(cercle)
    manquante = part_due(cercle, tour["id"])
    avant = lire(cercle.get("/etat"))["pot_rentre"]

    paie = lire(
        cercle.post(
            f"/tours/{tour['id']}/cotiser",
            json={"membre_id": manquante["id"], "mode": "momo_mtn"},
        )
    )
    assert paie["cotisation"]["reste"] == 0
    assert paie["cotisation"]["mode"] == "momo_mtn"
    assert paie["cotisation"]["reference"]

    apres = lire(cercle.get("/etat"))["pot_rentre"]
    assert apres == avant + manquante["reste"]

    refus = cercle.post(
        f"/tours/{tour['id']}/cotiser",
        json={"membre_id": manquante["id"], "mode": "especes"},
    )
    assert refus.status_code == 422
    assert refus.json()["detail"]["code"] == "part_deja_rentree"


def test_un_rail_coupe_refuse_la_part(cercle):
    tour = tour_ouvert(cercle)
    due = part_due(cercle, tour["id"])
    lire(cercle.put("/groupe", json=_groupe(momo=False)))
    refus = cercle.post(
        f"/tours/{tour['id']}/cotiser",
        json={"membre_id": due["id"], "mode": "momo_mtn"},
    )
    assert refus.status_code == 422
    assert refus.json()["detail"]["code"] == "rail_coupe"
    lire(cercle.put("/groupe", json=_groupe(momo=True)))


def test_payer_apres_le_jour_dit_ecrit_une_penalite(cercle):
    tour = tour_ouvert(cercle)
    due = part_due(cercle, tour["id"])
    paie = lire(
        cercle.post(
            f"/tours/{tour['id']}/cotiser",
            json={"membre_id": due["id"], "mode": "especes", "jour": "2099-01-05"},
        )
    )
    assert paie["cotisation"]["penalite"] == 500


def test_le_pot_ne_se_remis_quune_fois_complet(cercle):
    tour = tour_ouvert(cercle)
    due = part_due(cercle, tour["id"])

    # Avant le tirage, la remise est refusée pour une autre raison.
    refus = cercle.post(
        f"/tours/{tour['id']}/remettre", json={"temoin": "x", "mode": "especes"}
    )
    assert refus.status_code == 422
    assert refus.json()["detail"]["code"] == "tirage_d_abord"

    # Après le tirage, c'est le pot incomplet qui bloque.
    lire(cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": ""}))
    refus = cercle.post(
        f"/tours/{tour['id']}/remettre", json={"temoin": "x", "mode": "especes"}
    )
    assert refus.status_code == 422
    assert refus.json()["detail"]["code"] == "pot_incomplet"
    assert refus.json()["detail"]["vars"]["manquantes"] >= 1
    assert due["reste"] > 0


def test_le_recu_de_remise_se_verifie_sans_compte(cercle):
    """On solde tout le tour, on tire, on remet, puis on vérifie le jeton."""
    tour = tour_ouvert(cercle)
    for membre in lire(cercle.get(f"/membres?tour_id={tour['id']}"))["membres"]:
        if membre["actif"] and membre["reste"] > 0:
            lire(
                cercle.post(
                    f"/tours/{tour['id']}/cotiser",
                    json={"membre_id": membre["id"], "mode": "especes"},
                )
            )

    tirage = lire(cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": ""}))
    remise = lire(
        cercle.post(
            f"/tours/{tour['id']}/remettre",
            json={"temoin": "Irène Ndongo", "mode": "especes", "note": "à la séance"},
        )
    )
    assert remise["montant"] > 0
    assert len(remise["jeton"]) == 10

    # Le membre vérifie son code sans jamais ouvrir de compte.
    public = lire(cercle.get(f"/public/remises/{remise['jeton']}"))
    assert public["valide"] is True
    assert public["membre"] == tirage["gagnant"]
    assert public["temoin"] == "Irène Ndongo"

    # Un code inventé ne fuit rien d'autre qu'un refus bilingue.
    introuvable = cercle.get("/public/remises/ZZZZZZZZZZ")
    assert introuvable.status_code == 404
    assert introuvable.json()["detail"]["code"] == "jeton_inconnu"


def test_une_feuille_csv_se_telecharge_en_francais(cercle):
    rep = cercle.get("/exports/tours.csv")
    assert rep.status_code == 200
    assert rep.headers["content-type"].startswith("text/csv")
    assert "attachment" in rep.headers["content-disposition"]
    texte = rep.content.decode("utf-8-sig")
    assert texte.startswith("Tour;Date prevue;")
    assert rep.content[:3] == b"\xef\xbb\xbf"


def test_un_membre_simple_ne_peut_pas_tirer(cercle):
    lire(
        cercle.post(
            "/comptes",
            json={
                "nom": "Curieux du cercle",
                "email": "curieux@njangi.cm",
                "mot_de_passe": "Tontine2026!",
                "role": "membre",
            },
        )
    )
    tour = tour_ouvert(cercle)
    cercle.post("/auth/logout", json={})
    lire(
        cercle.post(
            "/auth/login",
            json={"email": "curieux@njangi.cm", "mot_de_passe": "Tontine2026!"},
        )
    )
    refus = cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": ""})
    assert refus.status_code == 403
    assert refus.json()["detail"]["code"] == "droits"


def test_la_preuve_se_relit_a_tout_moment(cercle):
    """La preuve n'existe pas qu'à la seconde du tirage : elle se relit."""
    tour = tour_ouvert(cercle)

    avant = lire(cercle.get(f"/tours/{tour['id']}/tirage"))
    assert avant["verifier"] is None, "un tour non tiré ne doit pas montrer un rang"

    tirage = lire(cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": ""}))
    apres = lire(cercle.get(f"/tours/{tour['id']}/tirage"))
    assert apres["verifier"]["index"] == tirage["verifier"]["index"]
    assert apres["verifier"]["nom"] == tirage["gagnant"]
    assert "algorithme" not in apres["verifier"], "une phrase d'écran n'est pas une donnée"


def test_le_dernier_tour_remis_porte_son_recu(cercle):
    """Écran de remise : le reçu doit survivre au passage du tour en « remis »."""
    tour = tour_ouvert(cercle)
    for membre in lire(cercle.get(f"/membres?tour_id={tour['id']}"))["membres"]:
        if membre["actif"] and membre["reste"] > 0:
            lire(
                cercle.post(
                    f"/tours/{tour['id']}/cotiser",
                    json={"membre_id": membre["id"], "mode": "especes"},
                )
            )
    lire(cercle.post(f"/tours/{tour['id']}/tirer", json={"graine": ""}))
    remise = lire(
        cercle.post(
            f"/tours/{tour['id']}/remettre",
            json={"temoin": "Alima", "mode": "especes", "note": ""},
        )
    )

    etat = lire(cercle.get("/etat"))
    assert etat["dernier"]["statut"] == "remis"
    assert etat["dernier"]["remise"]["jeton"] == remise["jeton"]
    assert etat["dernier"]["remise"]["membre"] == remise["membre"]


def _groupe(momo=True):
    return {
        "nom": "Njangi des Femmes et Hommes de Ndokoti",
        "ville": "Douala",
        "quartier": "Ndokoti",
        "frequence": "mensuel",
        "jour_ancre": 5,
        "cotisation": 10_000,
        "penalite": 500,
        "telephone": "+237699112204",
        "mot_du_groupe": "On cotise le 5.",
        "momo_actif": momo,
        "orange_actif": True,
        "especes_actifs": True,
    }


def test_la_fiche_membre_se_verifie_sans_compte(cercle):
    """Le code personnel du membre montre ses cotisations et ses pots."""
    membres = lire(cercle.get("/membres"))["membres"]
    membre = next(un for un in membres if un["actif"])
    assert membre["code"]
    assert membre["lien"].endswith(f"/membre/{membre['code']}")

    fiche = lire(cercle.get(f"/public/membre/{membre['code']}"))
    assert fiche["membre"] == membre["nom"]
    assert fiche["groupe"]
    assert "cotisations" in fiche and "pots" in fiche
    assert fiche["total_paye"] >= 0

    # Un code inventé est refusé sans rien dire de plus.
    introuvable = cercle.get("/public/membre/ZZZZZZZZ")
    assert introuvable.status_code == 404
    assert introuvable.json()["detail"]["code"] == "code_inconnu"
