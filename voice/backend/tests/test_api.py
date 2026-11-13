from datetime import datetime, time, timedelta
from collections import defaultdict

from app.services import switching
from app.utils import utcnow

POSITION_ACCUEIL = 1
TEMPS_DE_PASSE = (20, 45, 70, 95, 120, 145, 170, 195)
INSTANTS: dict[int, int] = defaultdict(int)
MOT_DE_PASSE = "Voix2026!"
EMAIL = "standard@iswouri.cm"

CHEMINS_PROTEGES = (
    "/dashboard",
    "/standard/etat",
    "/standard/guichets",
    "/calls",
    "/messages",
    "/appointments",
    "/lines",
    "/answers",
    "/services",
    "/closures",
    "/dispatches",
    "/settings",
    "/team",
    "/auth/me",
)

CHAMPS_REGLAGES = (
    "name",
    "kind",
    "city",
    "quartier",
    "main_line",
    "agent_name",
    "greeting",
    "greeting_en",
    "language",
    "tone",
    "callback_minutes",
    "sms_price",
    "discretion",
    "sms_enabled",
    "whatsapp_enabled",
    "voice_enabled",
    "auto_reminders",
    "daily_log",
)


def lire(reponse, attendu=200):
    assert reponse.status_code == attendu, reponse.text
    return reponse.json()


def postes(client):
    return client.get("/lines").json()


def poste_accueil(client):
    return next(p for p in postes(client) if p["position"] == POSITION_ACCUEIL)


def fermetures(client):
    return [
        (
            datetime.fromisoformat(c["starts"]).date(),
            datetime.fromisoformat(c["ends"]).date(),
        )
        for c in client.get("/closures").json()
    ]


def couvre(jour, ferme):
    return any(debut <= jour <= fin for debut, fin in ferme)


def creneau_ouvre(client, ligne_id):
    """Un instant où le poste décroche, jamais un jour de fermeture.

    Chaque fiche posée dans les tests prend son propre instant : deux appels à la
    même minute rempliraient les deux lignes du standard et la voix basculerait en
    file d'attente.
    """
    horaires = client.get(f"/lines/{ligne_id}").json()["schedules"]
    ferme = fermetures(client)
    reference = utcnow()
    candidats = []
    for decalage in range(0, 30):
        jour = (reference + timedelta(days=decalage)).date()
        if couvre(jour, ferme):
            continue
        for creneau in horaires:
            if creneau["weekday"] != jour.weekday():
                continue
            ouvre = time.fromisoformat(creneau["opens"])
            cloture = time.fromisoformat(creneau["closes"])
            for decalage_minutes in TEMPS_DE_PASSE:
                instant = datetime.combine(jour, ouvre) + timedelta(
                    minutes=decalage_minutes
                )
                if instant.time() >= cloture:
                    continue
                if instant <= reference:
                    continue
                candidats.append(instant)
    pas = INSTANTS[ligne_id]
    if pas >= len(candidats):
        raise AssertionError("Plus assez d'instants d'ouverture distincts.")
    INSTANTS[ligne_id] = pas + 1
    return candidats[pas]


def creneau_ferne(client, ligne_id):
    """Le soir d'une journée travaillée : le poste ne décroche plus."""
    horaires = client.get(f"/lines/{ligne_id}").json()["schedules"]
    ferme = fermetures(client)
    reference = utcnow()
    for decalage in range(1, 15):
        jour = (reference + timedelta(days=decalage)).date()
        if couvre(jour, ferme):
            continue
        if any(c["weekday"] == jour.weekday() for c in horaires):
            return datetime.combine(jour, time(23, 0))
    raise AssertionError("Aucun jour travaillé trouvé pour la fermeture.")


def menu(client, ligne_id):
    return client.get(f"/lines/{ligne_id}/menu").json()["menu"]


def touche(client, ligne_id, action):
    return next(e for e in menu(client, ligne_id) if e["action"] == action)


def appeler(client, ligne_id, **champs):
    payload = {"line_id": ligne_id}
    payload.update(champs)
    return lire(client.post("/standard/appeler", json=payload))


def sans_tirets(texte):
    for marqueur in ("—", "–"):
        assert marqueur not in texte, texte


def chaines(node, chemin="racine"):
    if isinstance(node, str):
        yield chemin, node
    elif isinstance(node, dict):
        for cle, valeur in node.items():
            yield from chaines(valeur, f"{chemin}.{cle}")
    elif isinstance(node, list):
        for index, valeur in enumerate(node):
            yield from chaines(valeur, f"{chemin}[{index}]")


def reglages_a_jour(client, **changements):
    organisation = lire(client.get("/settings"))["organization"]
    payload = {champ: organisation[champ] for champ in CHAMPS_REGLAGES}
    payload.update(changements)
    return payload


def test_sante_publique_parle_de_simulation(client):
    data = lire(client.get("/health"))
    assert data["status"] == "ok"
    assert data["demo"] is True
    sans_tirets(data["provider"])
    assert "simulés" in data["provider"]


def test_session_complete_puis_deconnexion(client):
    erreur = client.post("/auth/login", json={"email": EMAIL, "password": "mauvais"})
    assert erreur.status_code == 401
    assert erreur.json()["detail"] == "Email ou mot de passe incorrect."

    data = lire(
        client.post("/auth/login", json={"email": EMAIL, "password": MOT_DE_PASSE})
    )
    assert data["user"]["email"] == EMAIL
    assert data["organization"]["name"] == "Institut Supérieur du Wouri"
    assert data["demo"] is True
    assert lire(client.get("/auth/me"))["user"]["role"] == "standardiste"

    assert client.post("/auth/logout").status_code == 204
    assert client.get("/dashboard").status_code == 401


def test_chaque_route_exige_une_session(client):
    for chemin in CHEMINS_PROTEGES:
        assert client.get(chemin).status_code == 401, chemin
    detail = client.get("/dashboard").json()["detail"]
    assert detail.startswith("Votre session")
    assert "mot de passe" not in detail


def test_tableau_de_bord_raconte_la_journee(signed_in):
    data = lire(signed_in.get("/dashboard"))
    sans_tirets(data["day"])
    assert len(data["week"]) == 7
    assert len(data["lines"]) >= 3
    assert data["minutes_saved"] == 3 * data["calls_by_voice"]
    assert 0 <= data["share_voice"] <= 100
    assert data["calls_by_voice"] <= data["calls_today"]
    assert len(data["upcoming"]) <= 5
    assert data["recent_calls"]
    for appel in data["recent_calls"]:
        assert appel["duration_label"]
        for ligne in appel["script"]:
            sans_tirets(ligne)


def test_plaque_d_etat_donne_l_heure_de_reprise(signed_in):
    data = lire(signed_in.get("/standard/etat"))
    assert data["lines"]
    for ligne in data["lines"]:
        sans_tirets(ligne["today"])
        sans_tirets(ligne["next_label"])
        assert isinstance(ligne["open"], bool)
        if not ligne["open"] and ligne["next"]:
            assert " à " in ligne["next_label"]
    assert {guichet["name"] for guichet in data["guichets"]}


def test_journal_se_filtre_par_resultat_et_par_numero(signed_in):
    global_ = lire(signed_in.get("/calls?jours=60"))
    assert sum(global_["counts"].values()) == len(global_["calls"])
    assert global_["days"] == 60

    filtre = lire(signed_in.get("/calls?jours=60&outcome=message"))
    assert filtre["calls"]
    assert all(c["outcome"] == "message" for c in filtre["calls"])

    un_appel = global_["calls"][0]
    par_numero = lire(signed_in.get("/calls", params={"q": un_appel["caller_phone"]}))
    assert any(c["id"] == un_appel["id"] for c in par_numero["calls"])
    assert lire(signed_in.get(f"/calls/{un_appel['id']}"))["id"] == un_appel["id"]
    assert signed_in.get("/calls/424242").status_code == 404


def test_fiche_tapee_a_la_main_calcule_sa_duree(signed_in):
    script = "Poste : accueil.\nVoix : Bonjour.\nAppelant : rien de plus."
    data = lire(
        signed_in.post(
            "/calls",
            json={
                "caller_phone": "699307724",
                "caller_name": "Ngo Bassong",
                "handled": "humain",
                "outcome": "renseigne",
                "transcript": script,
            },
        )
    )
    assert data["caller_phone"] == "+237699307724"
    assert data["duration_sec"] == switching.duree_dictee(script.split("\n"))
    assert data["handled_label"] == "Tenu par une personne"
    sans_tirets(data["day"])


def test_horaire_incoherent_est_rejete_avant_d_etre_lu(signed_in):
    ligne = poste_accueil(signed_in)
    reponse = signed_in.post(
        f"/lines/{ligne['id']}/schedules",
        json={"weekday": 1, "opens": "14:00", "closes": "09:00"},
    )
    assert reponse.status_code == 422


def test_la_dictee_douverture_reflete_les_horaires(signed_in):
    ligne = poste_accueil(signed_in)
    ouvert = creneau_ouvre(signed_in, ligne["id"])
    data = lire(
        signed_in.post(
            "/standard/ouvrir",
            params={"line_id": ligne["id"], "at": ouvert.isoformat()},
        )
    )
    assert data["open"] is True
    assert data["script"][0].startswith(("Voix : Bonjour", "Voix : Bonsoir"))
    assert "Institut Supérieur du Wouri" in data["script"][0]
    assert len(data["menu"]) >= 4
    for choix in data["menu"]:
        sans_tirets(choix["label"])

    ferme = creneau_ferne(signed_in, ligne["id"])
    absent = lire(
        signed_in.post(
            "/standard/ouvrir",
            params={"line_id": ligne["id"], "at": ferme.isoformat()},
        )
    )
    assert absent["open"] is False
    assert absent["next_open"]
    assert any("reprend" in ligne_dictee for ligne_dictee in absent["script"])
    assert all(c["action"] == "message" for c in absent["menu"])


def test_touche_reponse_lit_le_repertoire_et_compte(signed_in):
    ligne = poste_accueil(signed_in)
    entree = touche(signed_in, ligne["id"], "reponse")
    before = next(
        a["hits"]
        for a in lire(signed_in.get("/answers"))["answers"]
        if a["id"] == entree["answer_id"]
    )
    bilan = appeler(
        signed_in,
        ligne["id"],
        digit=entree["digit"],
        at=creneau_ouvre(signed_in, ligne["id"]).isoformat(),
        caller_name="Tchoumi Landry",
    )
    assert bilan["outcome"] == "renseigne"
    assert bilan["answer_id"] == entree["answer_id"]
    assert bilan["handled"] == "voix"
    apres = next(
        a
        for a in lire(signed_in.get("/answers"))["answers"]
        if a["id"] == entree["answer_id"]
    )
    assert apres["hits"] == before + 1
    assert any(ligne_dictee.startswith("Voix :") for ligne_dictee in bilan["script"])


def test_question_hors_repertoire_devient_un_message(signed_in):
    ligne = poste_accueil(signed_in)
    bilan = appeler(
        signed_in,
        ligne["id"],
        question="est-ce que le gardien nourrit les poules ?",
        at=creneau_ouvre(signed_in, ligne["id"]).isoformat(),
    )
    assert bilan["outcome"] == "message"
    mot = next(
        m for m in lire(signed_in.get("/messages"))["messages"]
        if m["id"] == bilan["message_id"]
    )
    assert mot["body"].startswith("Question hors répertoire")
    assert mot["urgency"] == "note"
    sans_tirets(mot["promised_label"])


def test_rendez_vous_propose_pose_et_confirme(signed_in):
    ligne = poste_accueil(signed_in)
    moment = creneau_ouvre(signed_in, ligne["id"]).isoformat()
    entree = touche(signed_in, ligne["id"], "rendezvous")

    proposition = appeler(signed_in, ligne["id"], digit=entree["digit"], at=moment)
    assert proposition["slots"]
    assert proposition["appointment_id"] is None
    assert any("Je peux vous poser" in l for l in proposition["script"])

    repose = appeler(
        signed_in,
        ligne["id"],
        digit=entree["digit"],
        at=moment,
        appointment_start=proposition["slots"][0],
        caller_name="Aïcha Njifon",
        caller_phone="6 70 12 34 56",
    )
    assert repose["outcome"] == "rendezvous"
    assert repose["appointment_id"]
    assert any("C'est retenu" in l for l in repose["script"])

    place = next(
        a
        for a in lire(signed_in.get("/appointments?horizon=tous"))["appointments"]
        if a["id"] == repose["appointment_id"]
    )
    assert place["reference"].startswith("RDV")
    assert place["caller_phone"] == "+237670123456"
    assert place["origin"] == "voix"
    assert any(
        "votre place pour" in e["body"]
        for e in lire(signed_in.get("/dispatches"))["dispatches"]
    )


def test_touche_zero_vers_une_personne_quand_le_poste_est_tenu(signed_in):
    ligne = poste_accueil(signed_in)
    assert ligne["answered_by_human"] is True
    bilan = appeler(
        signed_in,
        ligne["id"],
        digit="0",
        at=creneau_ouvre(signed_in, ligne["id"]).isoformat(),
    )
    assert bilan["handled"] == "humain"
    assert bilan["outcome"] == "transfert"
    assert any("une personne" in l for l in bilan["script"])


def test_touche_zero_sur_un_poste_sans_humain_note_ou_raccroche(signed_in):
    internat = next(p for p in postes(signed_in) if not p["answered_by_human"])
    moment = creneau_ouvre(signed_in, internat["id"]).isoformat()

    note = appeler(
        signed_in,
        internat["id"],
        digit="0",
        at=moment,
        message_body="Une nuit hors campus la semaine prochaine.",
        caller_name="Estelle Mbarga",
    )
    assert note["outcome"] == "message"
    assert note["handled"] == "voix"
    mot = next(
        m for m in lire(signed_in.get("/messages"))["messages"]
        if m["id"] == note["message_id"]
    )
    assert mot["line_id"] == internat["id"]

    parti = appeler(signed_in, internat["id"], digit="0", at=moment)
    assert parti["outcome"] == "raccroche"
    assert any("carnet" in l for l in parti["script"])


def test_transfert_vers_un_autre_poste(signed_in):
    ligne = poste_accueil(signed_in)
    entree = touche(signed_in, ligne["id"], "transfert")
    bilan = appeler(
        signed_in,
        ligne["id"],
        digit=entree["digit"],
        at=creneau_ouvre(signed_in, ligne["id"]).isoformat(),
        caller_name="Etienne Manga",
    )
    assert bilan["outcome"] == "transfert"
    assert bilan["handled"] in ("humain", "voix")
    for ligne_dictee in bilan["script"]:
        sans_tirets(ligne_dictee)


def test_touche_inconnue_raccroche_avec_le_menu(signed_in):
    ligne = poste_accueil(signed_in)
    bilan = appeler(
        signed_in,
        ligne["id"],
        digit="8",
        at=creneau_ouvre(signed_in, ligne["id"]).isoformat(),
    )
    assert bilan["outcome"] == "raccroche"
    texte = "\n".join(bilan["script"])
    assert "n'existe pas sur ce poste" in texte
    assert "touche 0" in texte.lower()


def test_appelant_qui_raccroche_des_la_salutation(signed_in):
    ligne = poste_accueil(signed_in)
    bilan = appeler(
        signed_in,
        ligne["id"],
        hang_up=True,
        at=creneau_ouvre(signed_in, ligne["id"]).isoformat(),
    )
    assert bilan["outcome"] == "raccroche"
    assert bilan["duration_sec"] >= 15


def test_hors_horaires_le_bip_enregistre_ou_rien(signed_in):
    ligne = poste_accueil(signed_in)
    ferme = creneau_ferne(signed_in, ligne["id"])
    avec_mot = appeler(
        signed_in,
        ligne["id"],
        at=ferme.isoformat(),
        message_body="Rappelez la scolarité pour l'acte de naissance.",
        caller_name="Bertin Songo",
        urgency="urgent",
    )
    assert avec_mot["outcome"] == "message"
    assert avec_mot["handled"] == "messagerie"
    mot = next(
        m for m in lire(signed_in.get("/messages"))["messages"]
        if m["id"] == avec_mot["message_id"]
    )
    assert mot["body"].startswith("Rappelez la scolarité")

    silence = appeler(signed_in, ligne["id"], at=ferme.isoformat())
    assert silence["outcome"] == "hors_horaires"
    assert any("Bip. Silence" in l for l in silence["script"])


def test_main_courante_se_vide_au_bout_d_un_rappel(signed_in):
    cree = lire(
        signed_in.post(
            "/messages",
            json={
                "from_name": "Rose Abena",
                "from_phone": "+237 6 77 45 12 08",
                "body": "Elle demande le report de la deuxième tranche.",
                "urgency": "note",
                "promised_in_minutes": 45,
            },
        )
    )
    assert cree["from_phone"] == "+237677451208"
    assert cree["status"] == "nouveau"
    assert cree["overdue"] is False

    termine = lire(
        signed_in.patch(
            f"/messages/{cree['id']}",
            json={"status": "rappelle", "handled_note": "Rappelée, report accordé."},
        )
    )
    assert termine["recalled_at"]
    assert termine["handled_by"]
    assert termine["status_label"] == "Rappelé"

    file = lire(signed_in.get("/messages"))
    suit = next(m for m in file["messages"] if m["id"] == cree["id"])
    assert suit["status"] == "rappelle"
    assert signed_in.delete(f"/messages/{cree['id']}").status_code == 204
    assert signed_in.patch(
        "/messages/424242", json={"status": "nouveau"}
    ).status_code == 404


def test_message_promis_depuis_longtemps_passe_en_retard(signed_in):
    passe = utcnow() - timedelta(minutes=30)
    cree = lire(
        signed_in.post(
            "/messages",
            json={
                "from_name": "Ismaël Bello",
                "from_phone": "6 99 11 22 33",
                "body": "Il veut connaître la date des rattrapages.",
                "promised_at": passe.isoformat(),
            },
        )
    )
    assert cree["overdue"] is True
    retards = lire(signed_in.get("/messages?seulement_en_retard=true"))
    assert cree["id"] in [m["id"] for m in retards["messages"]]
    assert retards["late"] >= 1
    assert signed_in.delete(f"/messages/{cree['id']}").status_code == 204


def test_numero_incomplet_refuse_la_main_courante(signed_in):
    reponse = signed_in.post(
        "/messages",
        json={"from_name": "Xavier", "from_phone": "1234", "body": "un mot"},
    )
    assert reponse.status_code == 422


def test_agenda_et_creneaux_du_guichet(signed_in):
    guichets = lire(signed_in.get("/standard/guichets"))
    service = next(g for g in guichets if g["next"])
    file = lire(
        signed_in.get(
            "/appointments/slots", params={"service_id": service["id"], "limit": 6}
        )
    )
    assert file["service"] == service["name"]
    assert 0 < len(file["slots"]) <= 6
    assert file["calendar"]
    assert all(journee["free"] >= 0 for journee in file["calendar"])
    assert signed_in.get(
        "/appointments/slots", params={"service_id": 424242}
    ).status_code == 404

    choisi = lire(
        signed_in.post(
            "/appointments",
            json={
                "service_id": service["id"],
                "caller_name": "Pauline Ngo Bell",
                "caller_phone": "6 55 90 45 10",
                "starts_at": file["slots"][0],
                "note": "Dépôt de dossier.",
            },
        )
    )
    assert choisi["status"] == "confirme"
    assert choisi["origin"] == "console"
    assert len(choisi["reference"]) == 12
    sans_tirets(choisi["day"])

    rappele = lire(signed_in.post(f"/appointments/{choisi['id']}/rappel"))
    assert rappele["appointment"]["reminded"] is True
    assert rappele["dispatch"]["reference"].startswith("DEM-")

    annule = lire(
        signed_in.patch(
            f"/appointments/{choisi['id']}", json={"status": "annule"}
        )
    )
    assert annule["reminded"] is False
    relance = signed_in.post(f"/appointments/{choisi['id']}/rappel")
    assert relance.status_code == 422
    assert "annulé" in relance.json()["detail"]
    introuvable = signed_in.patch("/appointments/424242", json={"note": "x"})
    assert introuvable.status_code == 404
    assert signed_in.post("/appointments/424242/rappel").status_code == 404


def test_creneau_deja_passe_est_refuse(signed_in):
    guichets = lire(signed_in.get("/standard/guichets"))
    service = next(g for g in guichets if g["next"])
    reponse = signed_in.post(
        "/appointments",
        json={
            "service_id": service["id"],
            "caller_name": "Hervé Onana",
            "caller_phone": "6 77 45 12 08",
            "starts_at": (utcnow() - timedelta(days=2)).isoformat(),
        },
    )
    assert reponse.status_code == 422
    assert reponse.json()["detail"] == "Ce créneau est déjà passé."


def test_repertoire_se_vit_et_se_teste(signed_in):
    liste = lire(signed_in.get("/answers"))
    assert len(liste["answers"]) >= 10
    assert "Accueil" in liste["areas"]

    cree = lire(
        signed_in.post(
            "/answers",
            json={
                "statement": "Comment récupère-t-on une attestation ?",
                "keywords": "attestation papier retrait guichet",
                "body": "L'attestation sort le jour même, trois mille francs "
                "de timbre, pièce en main au guichet trois.",
                "area": "Scolarité",
                "follow_up": "Touche 2 pour un rendez-vous.",
            },
        )
    )
    corrige = lire(
        signed_in.patch(
            f"/answers/{cree['id']}",
            json={
                "statement": "Une attestation, ça se retire quand ?",
                "keywords": cree["keywords"],
                "body": cree["body"],
                "area": "Scolarité",
                "follow_up": "Le guichet trois ferme à midi.",
            },
        )
    )
    assert corrige["statement"].startswith("Une attestation")
    assert corrige["seconde"] > 0

    trouve = lire(
        signed_in.post(
            "/answers/tester",
            json={"question": "je veux une attestation, quel papier apporter"},
        )
    )
    assert trouve["found"] is True
    sans_tirets(trouve["dictation"])
    assert len(trouve["dictation"]) <= 260

    a_cote = lire(
        signed_in.post(
            "/answers/tester", json={"question": "le gardien est-il LÀ ?"}
        )
    )
    assert a_cote["found"] is False
    assert a_cote["fallback"]
    assert a_cote["mots"]

    detail = lire(signed_in.get(f"/answers/{cree['id']}"))
    assert detail["used_by"] == []
    assert signed_in.delete(f"/answers/{cree['id']}").status_code == 204
    assert signed_in.get(f"/answers/{cree['id']}").status_code == 404


def test_recherche_et_domaine_dans_le_repertoire(signed_in):
    data = lire(signed_in.get("/answers", params={"q": "internat"}))
    assert data["answers"]
    for fiche in data["answers"]:
        assert "internat" in (fiche["statement"] + fiche["keywords"]).lower()
    vide = lire(signed_in.get("/answers", params={"domaine": "Plomberie"}))
    assert vide["answers"] == []


def test_guichet_se_cree_se_regle_se_ferme(signed_in):
    cree = lire(
        signed_in.post(
            "/services",
            json={
                "name": "retrait des clés de chambre",
                "room": "logement B, rez-de-chaussée",
                "duration_min": 10,
                "step_min": 10,
                "lead_days": 1,
                "horizon_days": 8,
                "note": "Dépôt de caution en espèces.",
                "days": [
                    {"weekday": 1, "opens": "10:00", "closes": "12:00"},
                    {"weekday": 3, "opens": "10:00", "closes": "12:00"},
                    {"weekday": 1, "opens": "10:00", "closes": "12:00"},
                ],
            },
        )
    )
    assert len(cree["days"]) == 2
    assert cree["calendar"]

    regle = lire(
        signed_in.patch(
            f"/services/{cree['id']}",
            json={
                "name": "retrait des clés de chambre",
                "room": "logement B, premier étage",
                "duration_min": 10,
                "step_min": 20,
                "lead_days": 2,
                "horizon_days": 8,
                "note": "Caution en espèces uniquement.",
                "days": [{"weekday": 4, "opens": "14:00", "closes": "16:00"}],
            },
        )
    )
    assert regle["step_min"] == 20
    assert len(regle["days"]) == 1

    fichier = lire(signed_in.get(f"/services/{cree['id']}"))
    assert fichier["room"].endswith("étage")
    assert signed_in.delete(f"/services/{cree['id']}").status_code == 204
    assert signed_in.get("/services/424242").status_code == 404


def test_guichet_encore_utilise_refuse_de_fermer(signed_in):
    agenda = lire(signed_in.get("/appointments?horizon=futur"))["appointments"]
    tiens = next(a for a in agenda if a["status"] == "confirme")
    reponse = signed_in.delete(f"/services/{tiens['service_id']}")
    assert reponse.status_code == 422
    assert "rendez-vous" in reponse.json()["detail"]


def test_touches_gardent_leur_touche_et_leur_etablissement(signed_in):
    ligne = poste_accueil(signed_in)
    occupee = sorted(e["digit"] for e in menu(signed_in, ligne["id"]))[0]

    reprise = signed_in.post(
        f"/lines/{ligne['id']}/menu",
        json={"digit": occupee, "label": "Encore une fois", "action": "message"},
    )
    assert reprise.status_code == 422
    assert "déjà réglée" in reprise.json()["detail"]

    orpheline = signed_in.post(
        f"/lines/{ligne['id']}/menu",
        json={"digit": "8", "label": "Sans cible", "action": "reponse"},
    )
    assert orpheline.status_code == 422

    fausse = signed_in.post(
        f"/lines/{ligne['id']}/menu",
        json={
            "digit": "7",
            "label": "Ailleurs",
            "action": "transfert",
            "target_line_id": 424242,
        },
    )
    assert fausse.status_code == 422
    assert "établissement" in fausse.json()["detail"]

    chiffre = signed_in.post(
        f"/lines/{ligne['id']}/menu",
        json={"digit": "12", "label": "Deux chiffres", "action": "message"},
    )
    assert chiffre.status_code == 422

    guichets = lire(signed_in.get("/services"))
    creee = lire(
        signed_in.post(
            f"/lines/{ligne['id']}/menu",
            json={
                "digit": "7",
                "label": "Rendez-vous avec le conseiller",
                "action": "rendezvous",
                "service_id": guichets[0]["id"],
            },
        )
    )
    assert creee["action"] == "rendezvous"

    deplacee = lire(
        signed_in.patch(
            f"/menu/{creee['id']}",
            json={
                "digit": "8",
                "label": "Rendez-vous avec le conseiller",
                "action": "rendezvous",
                "service_id": guichets[0]["id"],
            },
        )
    )
    assert deplacee["digit"] == "8"

    conflit = signed_in.patch(
        f"/menu/{deplacee['id']}",
        json={"digit": occupee, "label": "Chevauchement", "action": "message"},
    )
    assert conflit.status_code == 422
    assert signed_in.delete(f"/menu/{deplacee['id']}").status_code == 204
    assert signed_in.patch(
        "/menu/424242", json={"digit": "3", "label": "Rien", "action": "message"}
    ).status_code == 404


def test_numero_hors_plan_ne_cree_pas_de_poste(signed_in):
    reponse = signed_in.post(
        "/lines", json={"label": "Poste test", "number": "6 77 45 12", "position": 4}
    )
    assert reponse.status_code == 422
    assert signed_in.get("/lines/424242").status_code == 404
    assert signed_in.delete("/schedules/424242").status_code == 404
    assert signed_in.delete("/closures/424242").status_code == 404
    assert signed_in.delete("/messages/424242").status_code == 404


def test_poste_se_jumele_puis_se_retire(signed_in):
    total = len(postes(signed_in))
    cree = lire(
        signed_in.post(
            "/lines",
            json={
                "label": "Antenne de Ydé",
                "number": "+237 6 99 45 12 08",
                "position": 9,
                "answered_by_human": False,
            },
        )
    )
    assert cree["number"] == "+237699451208"
    assert cree["number_display"] == "6 99 45 12 08"
    assert len(cree["week"]) == 7

    regle = lire(
        signed_in.patch(
            f"/lines/{cree['id']}",
            json={
                "label": "Antenne de Ydé, stage",
                "number": cree["number"],
                "position": 9,
                "answered_by_human": True,
            },
        )
    )
    assert regle["answered_by_human"] is True

    horaire = lire(
        signed_in.post(
            f"/lines/{cree['id']}/schedules",
            json={"weekday": 2, "opens": "09:00", "closes": "11:00"},
        )
    )
    assert horaire["label"] == "mercredi"
    assert len(lire(signed_in.get(f"/lines/{cree['id']}/schedules"))) == 1
    assert signed_in.delete(f"/schedules/{horaire['id']}").status_code == 204
    assert signed_in.delete(f"/lines/{cree['id']}").status_code == 204
    assert len(postes(signed_in)) == total


def test_fermetures_ne_se_chevauchent_pas(signed_in):
    debut, fin = fermetures(signed_in)[0]
    reprise = signed_in.post(
        "/closures",
        json={
            "starts": fin.isoformat(),
            "ends": (fin + timedelta(days=3)).isoformat(),
            "reason": "prolongation impossible",
        },
    )
    assert reprise.status_code == 422
    assert "couvre déjà" in reprise.json()["detail"]

    separee = lire(
        signed_in.post(
            "/closures",
            json={
                "starts": (utcnow().date() + timedelta(days=40)).isoformat(),
                "ends": (utcnow().date() + timedelta(days=41)).isoformat(),
                "reason": "inventaire des salles",
            },
        )
    )
    sans_tirets(separee["period"])
    assert " au " in separee["period"]

    renversee = signed_in.post(
        "/closures",
        json={
            "starts": (utcnow().date() + timedelta(days=50)).isoformat(),
            "ends": (utcnow().date() + timedelta(days=48)).isoformat(),
            "reason": "incohérence",
        },
    )
    assert renversee.status_code == 422
    assert signed_in.delete(f"/closures/{separee['id']}").status_code == 204


def test_envois_manuels_gardent_leur_reference_demo(signed_in):
    file = lire(signed_in.get("/dispatches"))
    assert file["demo"] is True
    assert file["sent"] + file["queued"] + file["failed"] == len(file["dispatches"])
    for envoi in file["dispatches"]:
        sans_tirets(envoi["body"])
        assert envoi["reference"].startswith("DEM-")

    trace = lire(
        signed_in.post(
            "/dispatches",
            json={
                "channel": "sms",
                "to_phone": "00237 6 86 20 40 60",
                "subject": "Rappel scolarité",
                "body": "Le guichet trois ferme à midi, pensez à la copie.",
            },
        )
    )
    assert trace["to_phone"] == "+237686204060"
    assert trace["status"] == "envoye"
    assert trace["sent_at"]

    tournee = lire(signed_in.post("/dispatches/relances"))
    assert tournee["reminders"] >= 0
    assert tournee["released"] >= 0

    numero = signed_in.post(
        "/dispatches",
        json={"channel": "sms", "to_phone": "86 20 40", "body": "numéro écourté"},
    )
    assert numero.status_code == 422


def test_canal_coupe_refuse_l_envoi(signed_in):
    lire(signed_in.put("/settings", json=reglages_a_jour(signed_in, sms_enabled=False)))
    refuse = signed_in.post(
        "/dispatches",
        json={"channel": "sms", "to_phone": "6 77 45 12 08", "body": "test coupé"},
    )
    assert refuse.status_code == 422
    assert "coupé" in refuse.json()["detail"]
    lire(signed_in.put("/settings", json=reglages_a_jour(signed_in, sms_enabled=True)))


def test_reglages_et_equipe_se_tiennent(signed_in):
    reglages = lire(signed_in.get("/settings"))
    assert reglages["currency"] == "FCFA"
    assert reglages["demo"] is True
    assert reglages["counters"]["calls"] >= 60
    assert reglages["counters"]["answers"] >= 10
    assert reglages["lines"][0]["menu"]
    assert reglages["organization"]["monthly_fee"] == 75000

    lire(
        signed_in.put(
            "/settings",
            json=reglages_a_jour(
                signed_in,
                agent_name="Marlène",
                greeting="Bonjour, ici {etablissement}, {agent} à l'appareil.",
                tone="sobre",
                callback_minutes=120,
            ),
        )
    )
    apercu = lire(signed_in.post("/settings/preview"))
    lignes = postes(signed_in)
    assert apercu["first"] == (
        "Bonjour, ici Institut Supérieur du Wouri, Marlène à l'appareil."
    )
    assert apercu["line"] == lignes[0]["label"]
    assert len(apercu["others"]) == len(lignes) - 1

    equipe = lire(signed_in.get("/team"))
    nouveau = lire(
        signed_in.post(
            "/team",
            json={
                "name": "Cyrille Mbassi",
                "email": "cyrille.mbassi@iswouri.cm",
                "password": "Cyrille2026!",
                "role": "responsable",
            },
        )
    )
    assert nouveau["role"] == "responsable"
    assert len(lire(signed_in.get("/team"))) == len(equipe) + 1

    doublon = signed_in.post(
        "/team", json={"name": "Copie", "email": EMAIL, "password": "Copie2026!"}
    )
    assert doublon.status_code == 422

    connexion = lire(
        signed_in.post(
            "/auth/login",
            json={"email": "cyrille.mbassi@iswouri.cm", "password": "Cyrille2026!"},
        )
    )
    assert connexion["user"]["name"] == "Cyrille Mbassi"

    lire(
        signed_in.put(
            "/settings",
            json=reglages_a_jour(signed_in, agent_name="Naëlle", greeting="",
                                 tone="chaleureux", callback_minutes=90),
        )
    )
    assert lire(signed_in.get("/settings"))["organization"]["agent_name"] == "Naëlle"


def test_aucun_tiret_de_mise_en_page_dans_les_reponses(signed_in):
    contenus = [
        signed_in.get("/dashboard"),
        signed_in.get("/standard/etat"),
        signed_in.get("/standard/guichets"),
        signed_in.get("/calls?jours=90"),
        signed_in.get("/messages"),
        signed_in.get("/appointments?horizon=tous"),
        signed_in.get("/answers"),
        signed_in.get("/dispatches"),
        signed_in.get("/settings"),
        signed_in.get("/closures"),
    ]
    for ligne in postes(signed_in):
        contenus.append(signed_in.get(f"/lines/{ligne['id']}"))
        contenus.append(signed_in.get(f"/lines/{ligne['id']}/menu"))
    vues = 0
    for reponse in contenus:
        assert reponse.status_code == 200, reponse.text
        for _, texte in chaines(reponse.json()):
            if texte:
                vues += 1
                sans_tirets(texte)
    assert vues > 400
