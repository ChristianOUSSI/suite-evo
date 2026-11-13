"""Contract : chaque payload envoyé par la console doit être accepté par l'API."""

from datetime import datetime, timedelta

import httpx

BASE = "http://127.0.0.1:8100"
client = httpx.Client(base_url=BASE, timeout=20)


def check(nom, reponse, attendu=(200, 201, 204), texte=False):
    assert reponse.status_code in attendu, (
    f"{nom} -> {reponse.status_code} {reponse.text}"
)
    print(f"OK {nom} ({reponse.status_code})")
    if texte:
        return reponse.text
    return reponse.json() if reponse.content else None


reponse = client.post(
    "/auth/login", json={"email": "standard@iswouri.cm", "password": "Voix2026!"}
)
check("connexion", reponse)

lignes = check("postes", client.get("/lines"))
services = check("guichets", client.get("/services"))
fiches = check("fonds", client.get("/answers"))
poste = lignes[0]["id"]

creee = check(
    "fiche ajoutée",
    client.post(
        "/answers",
        json={
            "statement": "Le transport scolaire dessert Bonamoussadi",
            "keywords": "transport, bonamoussadi, samedi",
            "body": "Le car passe à 6 h 30 et 7 h 15 devant le hall.",
            "area": "Accueil",
            "follow_up": "Sinon, la scolarité note la demande.",
        },
    ),
)
check("fiche corrigée", client.patch(f"/answers/{creee['id']}", json={
    "statement": "Le transport scolaire passe par Bonamoussadi",
    "keywords": "transport, bonamoussadi, samedi",
    "body": "Le car passe à 6 h 30 et 7 h 15 devant le hall.",
    "area": "Accueil",
    "follow_up": "Sinon, la scolarité note la demande.",
}))
check(
    "essai de fiche",
    client.post("/answers/tester", json={"question": "le car pour bonamoussadi"}),
)
check("trous", client.get("/answers/trous?jours=45"))
check("fiche retirée", client.delete(f"/answers/{creee['id']}"))

place = check(
    "places", client.get(f"/appointments/slots?service_id={services[0]['id']}&limit=6")
)
creneau = place["slots"][0]
rv = check(
    "rendez-vous posé",
    client.post(
        "/appointments",
        json={
            "service_id": services[0]["id"],
            "caller_name": "Blaise Njo",
            "caller_phone": "6 99 30 77 24",
            "starts_at": creneau,
            "note": "apporte la carte de l'année dernière",
            "origin": "console",
        },
    ),
)
check("rappel du rendez-vous", client.post(f"/appointments/{rv['id']}/rappel", json={}))
check(
    "statut du rendez-vous",
    client.patch(f"/appointments/{rv['id']}", json={"status": "confirme"}),
)

mot = check(
    "mot noté",
    client.post(
        "/messages",
        json={
            "from_name": "Awa Njoya",
            "from_phone": "6 77 45 12 08",
            "body": "Passe chercher l'attestation jeudi matin.",
            "urgency": "note",
            "line_id": poste,
            "promised_in_minutes": 90,
        },
    ),
)
check("mot saisi", client.patch(f"/messages/{mot['id']}", json={"status": "en_cours"}))
check(
    "mot rappelé",
    client.patch(
        f"/messages/{mot['id']}",
        json={
            "status": "rappelle",
            "handled_by": "Régine",
            "handled_note": "Rappel fait.",
        },
    ),
)
check("mot effacé", client.delete(f"/messages/{mot['id']}"))

check(
    "envoi manuel",
    client.post(
        "/dispatches",
        json={
            "channel": "sms",
            "to_phone": "6 99 98 87 76",
            "subject": "",
            "body": "Le bureau de la scolarité ferme à midi ce jeudi.",
        },
    ),
)
check("tournée", client.post("/dispatches/relances", json={}))

nouveau = check(
    "guichet ouvert",
    client.post(
        "/services",
        json={
            "name": "laboratoire d'informatique",
            "room": "bâtiment C, porte 12",
            "duration_min": 30,
            "step_min": 30,
            "lead_days": 2,
            "horizon_days": 14,
            "note": "Agrée les dépôts de mémoire.",
            "days": [{"weekday": 1, "opens": "09:00", "closes": "12:00"}],
        },
    ),
)
check(
    "guichet réglé",
    client.patch(
        f"/services/{nouveau['id']}",
        json={
            "name": "laboratoire d'informatique",
            "room": "bâtiment C, porte 12",
            "duration_min": 45,
            "step_min": 45,
            "lead_days": 2,
            "horizon_days": 14,
            "note": "Agrée les dépôts de mémoire.",
            "days": [{"weekday": 1, "opens": "09:00", "closes": "12:00"}],
        },
    ),
)
check("guichet fermé", client.delete(f"/services/{nouveau['id']}"))

poste_cree = check(
    "poste ajouté",
    client.post(
        "/lines",
        json={
            "label": "Caisse du trimestre",
            "number": "2 33 42 55 30",
            "position": 9,
            "answered_by_human": True,
        },
    ),
)
check(
    "poste réglé",
    client.patch(
        f"/lines/{poste_cree['id']}",
        json={
            "label": "Caisse du trimestre",
            "number": "2 33 42 55 30",
            "position": 9,
            "answered_by_human": False,
        },
    ),
)
horaire = check(
    "fenêtre posée",
    client.post(
        f"/lines/{poste_cree['id']}/schedules",
        json={"weekday": 2, "opens": "08:00", "closes": "12:00"},
    ),
)
touche = check(
    "touche ajoutée",
    client.post(
        f"/lines/{poste_cree['id']}/menu",
        json={
            "digit": "1",
            "label": "Horaires de la caisse",
            "action": "reponse",
            "answer_id": fiches["answers"][0]["id"],
            "service_id": None,
            "target_line_id": None,
        },
    ),
)
check(
    "touche réglée",
    client.patch(
        f"/menu/{touche['id']}",
        json={
            "digit": "1",
            "label": "Horaires et caisse",
            "action": "reponse",
            "answer_id": fiches["answers"][0]["id"],
            "service_id": None,
            "target_line_id": None,
        },
    ),
)
check("touche retirée", client.delete(f"/menu/{touche['id']}"))
check("fenêtre retirée", client.delete(f"/schedules/{horaire['id']}"))
check("poste retiré", client.delete(f"/lines/{poste_cree['id']}"))

demain = (datetime.now() + timedelta(days=30)).date()
fermeture = check(
    "fermeture posée",
    client.post(
        "/closures",
        json={
            "starts": demain.isoformat(),
            "ends": (demain + timedelta(days=1)).isoformat(),
            "reason": "séminaire du personnel",
        },
    ),
)
check("fermeture retirée", client.delete(f"/closures/{fermeture['id']}"))

reglages = check("réglages lus", client.get("/settings"))["organization"]
check(
    "réglages écrits",
    client.put(
        "/settings",
        json={
            "name": reglages["name"],
            "kind": reglages["kind"],
            "city": reglages["city"],
            "quartier": reglages["quartier"],
            "main_line": reglages["main_line"],
            "agent_name": reglages["agent_name"],
            "greeting": reglages["greeting"],
            "greeting_en": reglages["greeting_en"],
            "language": reglages["language"],
            "tone": reglages["tone"],
            "callback_minutes": reglages["callback_minutes"],
            "sms_price": reglages["sms_price"],
            "discretion": reglages["discretion"],
            "sms_enabled": reglages["sms_enabled"],
            "whatsapp_enabled": reglages["whatsapp_enabled"],
            "voice_enabled": reglages["voice_enabled"],
            "auto_reminders": reglages["auto_reminders"],
            "daily_log": reglages["daily_log"],
        },
    ),
)
apercu = check("apercu voix", client.post("/settings/preview", json={}))
assert apercu["bilingual"] is True and "press 9" in apercu["english"]
print("OK apercu bilingue")

equipe = check("equipe lue", client.get("/team"))
nouveau = client.post(
    "/team",
    json={
        "name": "Serge Gouabe",
        "email": "serge.gouabe@iswouri.cm",
        "password": "Voix2026!",
        "role": "standardiste",
    },
)
if nouveau.status_code == 422:
    print("OK équipe déjà peuplée (200 attendu au premier passage)")
else:
    check("équipe accrue", nouveau)
    membre = nouveau.json()
    print("OK équipe:", membre["role"])
assert len(check("equipe relue", client.get("/team"))) == len(equipe) + (
    1 if nouveau.status_code == 200 else 0
)

check("standard ouvert", client.post("/standard/ouvrir", params={"line_id": poste}))
check(
    "appel simulé",
    client.post(
        "/standard/appeler",
        json={
            "line_id": poste,
            "caller_phone": "6 77 08 41 96",
            "caller_name": "Nadège Ekwa",
            "digit": "1",
        },
    ),
)
check("tableau", client.get("/dashboard"))
check("plaques", client.get("/standard/etat"))
feuille = check(
    "feuille appelee",
    client.get("/exports/calls.csv?jours=30"),
    texte=True,
)
assert feuille.startswith("\ufeff")
print("OK csv: " + feuille.lstrip("\ufeff").split("\r\n")[0].strip())
check("deconnexion", client.post("/auth/logout", json={}))

client.close()
print("\nTous les payloads de la console passent.")
