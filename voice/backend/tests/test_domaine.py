"""Le domaine camerounais : bilinguisme, engorgement, fériés, carnet et tableur."""

from datetime import datetime, time, timedelta

from app.utils import utcnow

HISTORIQUE = 90
FENETRE_VOISINE = 25
PAS_DE_MINUTES = (30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360)

CHAMPS_REGLAGE = (
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


def poste(client, position):
    lignes = client.get("/lines").json()
    return next(ligne for ligne in lignes if ligne["position"] == position)


def instants_ouverts(client, ligne_id):
    """Tous les instants d'ouverture du poste, du plus proche au plus loin."""
    horaires = client.get(f"/lines/{ligne_id}").json()["schedules"]
    fermees = [
        (
            datetime.fromisoformat(c["starts"]).date(),
            datetime.fromisoformat(c["ends"]).date(),
        )
        for c in client.get("/closures").json()
    ]
    reference = utcnow()
    for decalage in range(0, 60):
        jour = (reference + timedelta(days=decalage)).date()
        if any(debut <= jour <= fin for debut, fin in fermees):
            continue
        for creneau in horaires:
            if creneau["weekday"] != jour.weekday():
                continue
            ouvre = time.fromisoformat(creneau["opens"])
            cloture = time.fromisoformat(creneau["closes"])
            for pas in PAS_DE_MINUTES:
                instant = datetime.combine(jour, ouvre) + timedelta(minutes=pas)
                if instant.time() >= cloture or instant <= reference:
                    continue
                yield instant


def instant_libre(client, ligne_id):
    """Un créneau ouvert où la voix ne chevauche aucun appel déjà posé."""
    fiches = client.get(
        f"/calls?line_id={ligne_id}&jours={HISTORIQUE}"
    ).json()["calls"]
    occupees = [datetime.fromisoformat(f["started_at"]) for f in fiches]
    for instant in instants_ouverts(client, ligne_id):
        trop_proche = any(
            abs((autre - instant).total_seconds()) < FENETRE_VOISINE * 60
            for autre in occupees
        )
        if not trop_proche:
            return instant
    raise AssertionError("Plus aucun instant d'ouverture libre sur ce poste.")


def appeler(client, ligne_id, moment=None, **champs):
    payload = {"line_id": ligne_id}
    if moment is not None:
        payload["at"] = moment.isoformat()
    payload.update(champs)
    return lire(client.post("/standard/appeler", json=payload))


def ouvrir(client, ligne_id, moment, **params):
    requete = {"line_id": ligne_id, "at": moment.isoformat()}
    requete.update(params)
    return lire(client.post("/standard/ouvrir", params=requete))


def reglages(client, **changements):
    organisation = lire(client.get("/settings"))["organization"]
    payload = {champ: organisation[champ] for champ in CHAMPS_REGLAGE}
    payload.update(changements)
    return payload


_COMPTEUR_NUMERO = 0


def numero_unique(tete):
    """Un numéro de neuf chiffres qui ne collisionne avec aucun appel posé."""
    global _COMPTEUR_NUMERO
    _COMPTEUR_NUMERO += 1
    return f"+237{tete}{_COMPTEUR_NUMERO % 1000000:06d}"


def test_la_touche_neuf_retourne_la_voix_anglaise(signed_in):
    accueil = poste(signed_in, 1)["id"]
    moment = instant_libre(signed_in, accueil)
    francais = ouvrir(signed_in, accueil, moment)
    anglais = ouvrir(signed_in, accueil, moment, langue="en")

    assert francais["language"] == "fr"
    assert anglais["language"] == "en"
    assert "touche 9" in francais["script"][0]
    assert "press 9" in anglais["script"][0]
    assert francais["menu"][0]["label"] == "Horaires et adresses"
    assert anglais["menu"][0]["label"] == "Opening hours and address"

    bascule = appeler(
        signed_in,
        accueil,
        moment,
        digit="9",
        caller_phone=numero_unique("677"),
    )
    assert bascule["language"] == "en"
    assert bascule["outcome"] == "renseigne"
    assert "You have been switched to English" in bascule["script"][1]
    assert bascule["script"][2].startswith("Voice : ")

    vu = lire(signed_in.get(f"/calls?jours={HISTORIQUE}&langue=en"))["calls"]
    assert bascule["call_id"] in [fiche["id"] for fiche in vu]
    fiche = next(f for f in vu if f["id"] == bascule["call_id"])
    assert fiche["language"] == "en"


def test_une_question_anglaise_lit_une_fiche_anglaise(signed_in):
    francais = lire(
        signed_in.post(
            "/answers/tester",
            json={"question": "quels sont vos horaires d'ouverture"},
        )
    )
    anglais = lire(
        signed_in.post(
            "/answers/tester",
            json={"question": "what are your opening hours", "language": "en"},
        )
    )
    assert francais["found"] is True
    assert francais["language"] == "fr"
    assert anglais["found"] is True
    assert anglais["language"] == "en"
    assert anglais["answer"]["bilingual"] is True
    assert anglais["dictation"] != francais["dictation"]

    accueil = poste(signed_in, 1)["id"]
    appele = appeler(
        signed_in,
        accueil,
        instant_libre(signed_in, accueil),
        question="what are your opening hours",
        language="en",
        caller_phone=numero_unique("699"),
    )
    assert appele["language"] == "en"
    assert any(mot.startswith("Voice : ") for mot in appele["script"])
    assert not any(mot.startswith("Voix : ") for mot in appele["script"][1:])


def test_un_poste_sature_range_dans_une_file(signed_in):
    scolarite = poste(signed_in, 2)
    assert scolarite["capacity"] == 1
    moment = instant_libre(signed_in, scolarite["id"])

    premier = appeler(
        signed_in,
        scolarite["id"],
        moment,
        digit="1",
        caller_phone=numero_unique("690"),
    )
    assert premier["outcome"] == "renseigne"

    second = appeler(
        signed_in,
        scolarite["id"],
        moment,
        digit="1",
        caller_phone=numero_unique("691"),
    )
    assert second["outcome"] == "sature"
    assert second["handled"] == "voix"
    assert second["message_id"]
    assert "en file au rang 1" in second["script"][1]
    assert second["script"][1].startswith("Voix : ")

    troisieme = appeler(
        signed_in,
        scolarite["id"],
        moment,
        digit="1",
        caller_phone=numero_unique("692"),
    )
    assert troisieme["outcome"] == "sature"
    assert "en file au rang 2" in troisieme["script"][1]
    assert troisieme["message_id"] != second["message_id"]

    file = lire(signed_in.get("/messages"))["messages"]
    mot = next(m for m in file if m["id"] == second["message_id"])
    assert "Rappel file d'attente, rang 1" in mot["body"]
    assert mot["promised_label"]

    journal = lire(signed_in.get(f"/calls?jours={HISTORIQUE}"))["counts"]
    assert journal["sature"] >= 3

    plaque = lire(signed_in.get("/standard/etat"))["lines"]
    ligne = next(p for p in plaque if p["id"] == scolarite["id"])
    assert ligne["capacity"] == 1
    assert isinstance(ligne["saturated"], bool)
    assert isinstance(ligne["prises"], int)


def test_le_calendrier_national_bouche_le_standard(signed_in):
    calendrier = lire(signed_in.get("/holidays?year=2027"))
    assert calendrier["year"] == 2027
    assert 2027 in calendrier["covered"]
    raisons = {ferie["reason"] for ferie in calendrier["holidays"]}
    assert {"Fête nationale", "Fête de la Jeunesse", "Noël", "Tabaski"} <= raisons
    estime = [f for f in calendrier["holidays"] if f["estimated"]]
    assert {f["reason"] for f in estime} == {
        "Aïd el-Fitr",
        "Tabaski",
        "Anniversaire du Prophète",
    }
    assert all("à confirmer" in f["label"] for f in estime)
    assert all(f["reason_en"] for f in calendrier["holidays"])

    importes = lire(signed_in.post("/holidays", json={"year": 2027}))
    assert importes["added"] == calendrier["missing"]
    assert importes["skipped"] == len(calendrier["holidays"]) - importes["added"]

    refait = lire(signed_in.post("/holidays", json={"year": 2027}))
    assert refait["added"] == 0
    assert refait["skipped"] == importes["added"]

    fete_nationale = datetime(2027, 5, 20, 10, 0)
    assert fete_nationale.weekday() in {0, 1, 2, 3, 4}
    ferme = ouvrir(signed_in, poste(signed_in, 1)["id"], fete_nationale)
    assert ferme["open"] is False
    assert ferme["next_open"]

    posees = importes["closures"]
    assert {rangee["reason"] for rangee in posees} >= {
        "Fête nationale",
        "Fête de la Jeunesse",
        "Noël",
    }
    for rangee in posees:
        assert rangee["kind"] == "ferie"
        assert rangee["kind_label"]
        assert signed_in.delete(f"/closures/{rangee['id']}").status_code == 204

    reprise = ouvrir(signed_in, poste(signed_in, 1)["id"], fete_nationale)
    assert reprise["open"] is True


def test_le_carnet_reconnait_avant_que_la_voix_parle(signed_in):
    carnet = lire(signed_in.get("/contacts"))
    assert len(carnet["contacts"]) >= 8
    assert carnet["recognized"] >= len(carnet["contacts"])
    codes = {t["code"] for t in carnet["tags"]}
    assert codes == {
        "parent",
        "eleve",
        "fournisseur",
        "medecin",
        "administration",
        "autre",
    }

    maman = next(c for c in carnet["contacts"] if c["salutation"] == "maman Ndoh")
    assert maman["tag_label"] == "Parent d'élève"
    assert "+237" in maman["phone"]
    accueil = poste(signed_in, 1)["id"]
    salue = ouvrir(
        signed_in, accueil, instant_libre(signed_in, accueil),
        caller_phone=maman["phone"],
    )
    assert "maman Ndoh" in salue["script"][0]
    inconnu = ouvrir(signed_in, accueil, instant_libre(signed_in, accueil))
    assert "maman Ndoh" not in inconnu["script"][0]

    avant = len(lire(signed_in.get("/contacts"))["contacts"])
    numero = numero_unique("675")
    appeler(
        signed_in,
        accueil,
        instant_libre(signed_in, accueil),
        digit="1",
        caller_phone=numero,
        caller_name="Rachelle Dobene",
    )
    depuis = lire(signed_in.get("/contacts"))["contacts"]
    assert len(depuis) == avant + 1
    nouvelle = next(c for c in depuis if c["phone"] == numero)
    assert nouvelle["name"] == "Rachelle Dobene"
    assert nouvelle["call_count"] == 1
    assert nouvelle["tag"] == "autre"

    corrige = lire(
        signed_in.patch(
            f"/contacts/{nouvelle['id']}",
            json={"tag": "parent", "note": "Voisine du dortoir des filles."},
        )
    )
    assert corrige["tag_label"] == "Parent d'élève"
    assert corrige["note"] == "Voisine du dortoir des filles."

    doublon = signed_in.post(
        "/contacts", json={"phone": "6 75 " + numero[-6:], "name": "Copie"}
    )
    assert doublon.status_code == 422
    assert "déjà" in doublon.json()["detail"]

    # la secrétaire note un numéro avant même qu'il n'appelle
    anticipe = lire(
        signed_in.post(
            "/contacts",
            json={
                "phone": "2 33 42 55 90",
                "name": "Cantine Sainte Thérèse",
                "tag": "fournisseur",
                "salutation": "madame Ngo",
            },
        )
    )
    assert anticipe["phone"] == "+237233425590"
    assert anticipe["call_count"] == 0
    assert signed_in.delete(f"/contacts/{anticipe['id']}").status_code == 204
    assert signed_in.delete(f"/contacts/{nouvelle['id']}").status_code == 204
    assert len(lire(signed_in.get("/contacts"))["contacts"]) == avant


def test_le_repertoire_signale_ce_qu_il_ne_sait_pas_dire(signed_in):
    accueil = poste(signed_in, 1)["id"]
    question = "le transport scolaire passe t il par bonamoussadi un samedi"
    for _ in range(2):
        reponse = appeler(
            signed_in,
            accueil,
            instant_libre(signed_in, accueil),
            question=question,
            caller_phone=numero_unique("671"),
        )
        assert reponse["outcome"] == "message"
        assert reponse["answer_id"] is None

    trous = lire(signed_in.get("/answers/trous?jours=90"))
    assert trous["since_days"] == 90
    rangee = next(f for f in trous["holes"] if "transport" in f["racine"])
    assert rangee["count"] >= 2
    assert rangee["repeated"] is True
    assert "bonamoussadi" in rangee["keywords"]
    assert question.lower().startswith(rangee["example"].lower()[:12])
    assert trous["to_fill"] >= 1
    assert "transport" in trous["suggested"]["keywords"]
    assert trous["suggested"]["statement"].startswith("À proposer :")

    vide = lire(signed_in.get("/answers/trous?jours=3"))
    assert vide["holes"] == [] or isinstance(vide["holes"], list)


def test_une_feuille_de_tableur_s_ouvre_sans_brutalité(signed_in):
    tracee = lire(
        signed_in.post(
            "/calls",
            json={
                "caller_name": "=SOMME(A1:A9)",
                "caller_phone": "6 90 11 22 33",
                "handled": "humain",
                "outcome": "renseigne",
                "transcript": "Appel noté à la main au comptoir.",
            },
        )
    )
    assert tracee["caller_name"] == "=SOMME(A1:A9)"

    reponse = signed_in.get(f"/exports/calls.csv?jours={HISTORIQUE}")
    assert reponse.status_code == 200
    assert reponse.headers["content-type"].startswith("text/csv")
    entete = reponse.headers["content-disposition"]
    assert "institut-superieur-du-wouri-journal-" in entete
    assert entete.rstrip().endswith('.csv"')

    texte = reponse.text
    assert texte.startswith("\ufeff")
    assert "\r\n" in texte
    lignes = texte.split("\r\n")
    assert lignes[0] == (
        "\ufeffDate;Heure;Poste;Numéro;Nom;Durée;Tenu par;Résultat;"
        "Touche;Question posée;Dictée"
    )
    assert len(lignes) > 12
    assert any("'=SOMME(A1:A9)" in rangee for rangee in lignes)
    for rangee in lignes[1:-1]:
        assert rangee.count(";") == 10
        assert "\n" not in rangee

    autres = {
        "/exports/contacts.csv": "Nom;Numéro;Qualité;Note;Appels;",
        "/exports/messages.csv": "Référence;Poste;De qui;Numéro;Message;",
        "/exports/appointments.csv": "Référence;Jour;Heure;Guichet;Salle;",
        "/exports/closures.csv": "Début;Fin;Motif;Reason;Nature;Jours",
    }
    for chemin, debut in autres.items():
        feuille = signed_in.get(chemin)
        assert feuille.status_code == 200, chemin
        assert feuille.text.startswith("\ufeff"), chemin
        entete = feuille.text.lstrip("\ufeff").split("\r\n")[0]
        assert entete.startswith(debut), f"{chemin} -> {entete}"


def test_la_caisse_des_sms_compte_segment_par_segment(signed_in):
    tarif = lire(signed_in.get("/settings"))["organization"]["sms_price"]
    assert tarif == 8

    court = lire(
        signed_in.post(
            "/dispatches",
            json={
                "channel": "sms",
                "to_phone": "6 99 98 87 76",
                "body": "Rappel : la caisse ferme a 17 h.",
            },
        )
    )
    assert court["segments"] == 1
    assert court["cost"] == tarif
    assert court["language"] == "fr"

    long = lire(
        signed_in.post(
            "/dispatches",
            json={
                "channel": "sms",
                "to_phone": "6 99 98 87 76",
                "body": (
                    "Le guichet des inscriptions garde vos pièces jusqu'à "
                    "vendredi, pensez à la copie certifiée, à la quittance de "
                    "la banque et surtout à la photo d'identité récente qui "
                    "manque encore au dossier de votre fille. " * 2
                ),
            },
        )
    )
    assert long["segments"] >= 3
    assert long["cost"] == long["segments"] * tarif

    whatsapp = lire(
        signed_in.post(
            "/dispatches",
            json={
                "channel": "whatsapp",
                "to_phone": "6 99 98 87 76",
                "body": "Le poste d'accueil a bien reçu votre demande.",
            },
        )
    )
    assert whatsapp["cost"] == 0
    assert whatsapp["segments"] >= 1

    semaine = lire(signed_in.get("/dashboard"))
    assert isinstance(semaine["week_sms_cost"], int)
    assert semaine["week_sms_cost"] >= court["cost"] + long["cost"]


def test_le_tableau_de_bord_suiv_l_heure_de_pointe(signed_in):
    bord = lire(signed_in.get("/dashboard"))
    for champ in (
        "week_calls",
        "week_saturations",
        "week_sms_cost",
        "week_english",
        "rush",
        "holes",
        "known_numbers",
        "next_holiday",
    ):
        assert champ in bord, champ

    assert 0 <= bord["week_saturations"] <= bord["week_calls"]
    assert bord["week_english"] <= bord["week_calls"]
    assert bord["rush"]["hour"].endswith("h")
    assert 0 < bord["rush"]["calls"] <= bord["week_calls"]
    assert 1 <= len(bord["rush"]["touches"]) <= 3
    for touche in bord["rush"]["touches"]:
        assert len(touche["digit"]) == 1
        assert touche["count"] >= 1
    assert bord["known_numbers"] >= 8
    ferie = bord["next_holiday"]
    assert ferie["days_away"] >= 1
    assert ferie["label"].split(",")[0].endswith(ferie["starts"][:4])
    assert ferie["label_en"]
    sans_tiret = [ferie["label"], ferie["label_en"], bord["rush"]["hour"]]
    assert all("—" not in mot and "–" not in mot for mot in sans_tiret)


def test_l_etablissement_discret_ne_confirme_jamais(signed_in):
    accueil = poste(signed_in, 1)["id"]
    lire(
        signed_in.put(
            "/settings",
            json=reglages(
                signed_in,
                discretion=True,
                greeting_en="Good day, {etablissement}, {agent} at the desk.",
            ),
        )
    )
    organisation = lire(signed_in.get("/settings"))["organization"]
    assert organisation["discretion"] is True
    assert organisation["greeting_en"].startswith("Good day")

    apercu = lire(signed_in.post("/settings/preview"))
    assert apercu["english"] == "Good day, Institut Supérieur du Wouri, Naëlle " \
        "at the desk."
    assert apercu["bilingual"] is True
    assert apercu["first"] != apercu["english"]

    francophone = appeler(
        signed_in,
        accueil,
        instant_libre(signed_in, accueil),
        asked_for="Serge Kamga",
        caller_phone=numero_unique("678"),
    )
    assert francophone["outcome"] == "message"
    assert "Nous ne confirmons jamais la présence de Serge Kamga" in (
        francophone["script"][1]
    )

    anglophone = appeler(
        signed_in,
        accueil,
        instant_libre(signed_in, accueil),
        asked_for="Serge Kamga",
        language="en",
        caller_phone=numero_unique("679"),
    )
    assert anglophone["outcome"] == "message"
    assert "We never confirm whether Serge Kamga is here" in (
        anglophone["script"][1]
    )

    lire(signed_in.put("/settings", json=reglages(signed_in, discretion=False)))
    tablé = appeler(
        signed_in,
        accueil,
        instant_libre(signed_in, accueil),
        asked_for="Serge Kamga",
        digit="5",
        message_body="Une simple question de dossier.",
        caller_phone=numero_unique("670"),
    )
    assert tablé["outcome"] == "message"
    assert "Nous ne confirmons jamais" not in " ".join(tablé["script"])
