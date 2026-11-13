from datetime import date, timedelta


def test_login_and_session(client):
    response = client.post(
        "/auth/login",
        json={"email": "patron@nanafils.cm", "password": "Palabre2026!"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["merchant"]["name"] == "Quincaillerie Nana & Fils"
    assert payload["demo"] is True

    session = client.get("/auth/me")
    assert session.status_code == 200
    assert session.json()["user"]["email"] == "patron@nanafils.cm"


def test_login_refuses_a_bad_password(client):
    response = client.post(
        "/auth/login",
        json={"email": "patron@nanafils.cm", "password": "mauvais-mot-de-passe"},
    )
    assert response.status_code == 401


def test_private_routes_need_a_session(client):
    response = client.get("/dashboard")
    assert response.status_code == 401


def test_dashboard_adds_up(signed_in):
    response = signed_in.get("/dashboard")
    assert response.status_code == 200
    data = response.json()
    stats = data["stats"]

    assert stats["outstanding"] > 0
    assert stats["overdue"] > 0
    assert stats["collected_month"] > 0
    assert len(data["aging"]) == 5
    assert sum(bucket["amount"] for bucket in data["aging"]) == stats["outstanding"]
    assert data["as_of"] == date.today().isoformat()
    assert data["priorities"]


def test_invoice_list_and_detail(signed_in):
    listing = signed_in.get("/invoices")
    assert listing.status_code == 200
    data = listing.json()
    assert data["total_count"] == 23
    assert data["counts"]["all"] == 23
    assert data["items"]

    reference = data["items"][0]["reference"]
    detail = signed_in.get(f"/invoices/{reference}")
    assert detail.status_code == 200
    payload = detail.json()
    assert payload["reference"] == reference
    assert payload["customer"]["phone_display"].startswith("+237")
    for reminder in payload["reminders"]:
        assert "—" not in reminder["body"]
        assert "–" not in reminder["body"]

    for item in data["items"]:
        opened = signed_in.get(f"/invoices/{item['reference']}")
        assert opened.status_code == 200, item["reference"]
        moments = [
            reminder["sent_at"] or f"{reminder['scheduled_on']}T00:00:00"
            for reminder in opened.json()["reminders"]
        ]
        assert moments == sorted(moments, reverse=True)


def test_import_and_promise_validation(signed_in):
    due = (date.today() + timedelta(days=12)).isoformat()
    rows = [
        {
            "customer_name": "Ets Moukoko Matériaux",
            "phone": "6 90 44 17 22",
            "label": "Ciment et sable pour dallage",
            "amount_due": 275_000,
            "due_on": due,
            "quartier": "Ndokotti",
        },
        {
            "customer_name": "Mme Esther Ngo Bell",
            "phone": "+237 6 55 77 81 04",
            "label": "Peinture pour deux salons",
            "amount_due": 84_000,
            "due_on": due,
        },
    ]
    response = signed_in.post("/invoices/import", json={"rows": rows})
    assert response.status_code == 201, response.text
    imported = response.json()
    assert imported["imported"] == 2
    assert len(imported["invoices"]) == 2

    check = signed_in.post("/invoices/import/check", json={"rows": rows})
    assert check.status_code == 200
    assert len(check.json()["duplicates"]) == 2

    again = signed_in.post("/invoices/import", json={"rows": rows})
    assert again.status_code == 201
    assert again.json()["imported"] == 0
    assert again.json()["skipped"] == 2
    assert "Déjà au carnet" in again.json()["errors"][0]["message"]

    reference = imported["invoices"][0]
    invoice = signed_in.get(f"/invoices/{reference}").json()
    promise = signed_in.post(
        f"/invoices/{reference}/promise",
        json={
            "amount": invoice["remaining"] + 1,
            "promised_on": date.today().isoformat(),
        },
    )
    assert promise.status_code == 422

    valid = signed_in.post(
        f"/invoices/{reference}/promise",
        json={
            "amount": 100_000,
            "promised_on": (date.today() + timedelta(days=3)).isoformat(),
            "note": "Passe déposer l'acompte vendredi.",
        },
    )
    assert valid.status_code == 201
    assert valid.json()["status"] == "active"


def test_import_catches_a_duplicate_inside_the_file(signed_in):
    row = {
        "customer_name": "Atelier Bikoué",
        "phone": "6 77 12 34 56",
        "label": "Deux portes en bois rouge",
        "amount_due": 165_000,
        "due_on": (date.today() + timedelta(days=8)).isoformat(),
        "quartier": "Akwa",
    }
    preview = signed_in.post(
        "/invoices/import/check", json={"rows": [row, row]}
    )
    assert preview.status_code == 200
    duplicates = preview.json()["duplicates"]
    assert len(duplicates) == 1
    assert duplicates[0]["row"] == 2
    assert duplicates[0]["reference"] is None

    response = signed_in.post("/invoices/import", json={"rows": [row, row]})
    assert response.status_code == 201
    result = response.json()
    assert result["imported"] == 1
    assert result["skipped"] == 1
    assert "Doublon dans le fichier" in result["errors"][0]["message"]


def test_reminder_cycle_is_idempotent(signed_in):
    dry_run = signed_in.post("/reminders/run", params={"dry_run": True})
    assert dry_run.status_code == 200
    preview = dry_run.json()
    assert preview["dry_run"] is True

    first = signed_in.post("/reminders/run")
    assert first.status_code == 200
    assert first.json()["sent"] >= 1

    second = signed_in.post("/reminders/run")
    assert second.status_code == 200
    assert second.json()["sent"] == 0


def test_direct_reminder_and_settings(signed_in):
    listing = signed_in.get("/invoices").json()
    reference = next(
        item["reference"]
        for item in listing["items"]
        if item["stage"] == "late"
    )
    response = signed_in.post(f"/invoices/{reference}/remind")
    assert response.status_code == 200, response.text
    reminder = response.json()["reminder"]
    assert reminder["status"] == "sent"
    assert reminder["channel"] in {"sms", "whatsapp", "voice"}
    assert "—" not in reminder["body"]

    updated = signed_in.patch("/settings", json={"tone": "ferme"})
    assert updated.status_code == 200
    assert updated.json()["merchant"]["tone"] == "ferme"

    blocked = signed_in.patch(
        "/settings",
        json={
            "sms_enabled": False,
            "whatsapp_enabled": False,
            "voice_enabled": False,
        },
    )
    assert blocked.status_code == 422

    signed_in.patch("/settings", json={"tone": "courtois"})


def test_direct_reminder_keeps_the_planned_follow_up(signed_in):
    detail = signed_in.get("/invoices/PAL-2026-0005").json()
    planned_before = [
        reminder["id"]
        for reminder in detail["reminders"]
        if reminder["status"] == "planned"
    ]
    assert planned_before

    response = signed_in.post("/invoices/PAL-2026-0005/remind")
    assert response.status_code == 200, response.text
    reminder = response.json()["reminder"]
    assert reminder["step_label"] == "Relance manuelle"
    if reminder["channel"] == "sms":
        assert "STOP" in reminder["body"]
    else:
        assert "STOP" not in reminder["body"]

    after = signed_in.get("/invoices/PAL-2026-0005").json()
    planned_after = [
        item["id"]
        for item in after["reminders"]
        if item["status"] == "planned"
    ]
    assert planned_after == planned_before


def test_public_payment_closes_the_invoice(signed_in):
    listing = signed_in.get("/invoices", params={"stage": "late"}).json()
    candidate = next(
        item for item in listing["items"] if item["remaining"] > 0
    )
    token = candidate["public_token"]

    public = signed_in.get(f"/public/invoices/{token}")
    assert public.status_code == 200
    assert public.json()["remaining"] == candidate["remaining"]

    partial = signed_in.post(
        f"/public/invoices/{token}/pay",
        json={
            "amount": 25_000,
            "method": "momo_mtn",
            "phone": "6 77 08 41 96",
        },
    )
    assert partial.status_code == 201, partial.text
    receipt = partial.json()
    assert receipt["amount"] == 25_000
    assert receipt["remaining"] == candidate["remaining"] - 25_000

    final = signed_in.post(
        f"/public/invoices/{token}/pay",
        json={
            "amount": receipt["remaining"],
            "method": "momo_orange",
            "phone": "6 77 08 41 96",
        },
    )
    assert final.status_code == 201
    assert final.json()["invoice_status"] == "paid"

    detail = signed_in.get(
        f"/invoices/{candidate['reference']}"
    ).json()
    assert detail["stage"] == "paid"
    assert detail["can_pay"] is False
    assert all(
        reminder["status"] != "planned"
        for reminder in detail["reminders"]
    )

    overpay = signed_in.post(
        f"/public/invoices/{token}/pay",
        json={
            "amount": 1_000,
            "method": "momo_mtn",
            "phone": "6 77 08 41 96",
        },
    )
    assert overpay.status_code == 409
