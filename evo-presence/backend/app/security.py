from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

import jwt

from .config import settings


def hash_password(password: str) -> str:
    sel = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"), salt=sel, n=2**14, r=8, p=1, dklen=64
    )
    return "scrypt$16384$8$1${}${}".format(
        base64.b64encode(sel).decode(), base64.b64encode(digest).decode()
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithme, n, r, p, sel_b64, digest_b64 = stored.split("$")
        if algorithme != "scrypt":
            return False
        sel = base64.b64decode(sel_b64)
        attendu = base64.b64decode(digest_b64)
        candidat = hashlib.scrypt(
            password.encode("utf-8"),
            salt=sel,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(attendu),
        )
        return hmac.compare_digest(candidat, attendu)
    except (ValueError, TypeError):
        return False


def creer_jeton(user_id: int, organisation_id: int) -> str:
    instant = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "organisation": organisation_id,
        "iat": instant,
        "exp": instant + timedelta(hours=settings.jwt_ttl_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def lire_jeton(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


# alphabet sans I, O, 0, 1 : un code se dicte au téléphone par-dessus le
# bruit d'une bétonnière, sans épeler.
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def code_de_controle(organisation_id: int, ouvrier_id: int, periode: str) -> str:
    """Le code que l'ouvrier garde pour vérifier ses propres journées.

    Il est dérivé, pas stocké : le chef de chantier ne peut pas le changer
    après coup, et le même mois redonne toujours le même code. Sans le secret
    du serveur, personne ne peut le deviner d'avance.
    """
    base = f"{organisation_id}|{ouvrier_id}|{periode}".encode("utf-8")
    empreinte = hmac.new(settings.jwt_secret.encode("utf-8"), base, hashlib.sha256).digest()
    nombre = int.from_bytes(empreinte[:8], "big")
    sortir = []
    for _ in range(10):
        nombre, reste = divmod(nombre, len(ALPHABET))
        sortir.append(ALPHABET[reste])
    return "".join(sortir)


def code_pointage(employe_id: int) -> str:
    """Le code du pointage partagé : stable, dérivé, sans colonne en base.

    L'employé le garde sur son téléphone ou le mémorise ; l'écran de
    l'entrée le reconnaît sans jamais demander de compte. Huit signes,
    même alphabet que le bulletin : se dicte sans ambiguïté.
    """
    base = f"pointage|{employe_id}".encode("utf-8")
    empreinte = hmac.new(settings.jwt_secret.encode("utf-8"), base, hashlib.sha256).digest()
    nombre = int.from_bytes(empreinte[:5], "big")
    sortir = []
    for _ in range(8):
        nombre, reste = divmod(nombre, len(ALPHABET))
        sortir.append(ALPHABET[reste])
    return "".join(sortir)
