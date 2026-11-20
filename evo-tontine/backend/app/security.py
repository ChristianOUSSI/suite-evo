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


def creer_jeton(user_id: int, groupe_id: int) -> str:
    instant = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "groupe": groupe_id,
        "iat": instant,
        "exp": instant + timedelta(hours=settings.jwt_ttl_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def lire_jeton(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def jeton_public(longueur: int = 10) -> str:
    """La clé du reçu de remise, lue à voix haute au membre qui reçoit."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(longueur))


def code_membre(membre_id: int) -> str:
    """Le code personnel du membre, stable et sans colonne en base.

    HMAC(secret, id) tronqué : le même membre garde le même code après
    chaque redémarrage, et deviner le code d'un autre demande de casser
    le HMAC.
    """
    digest = hmac.new(
        settings.jwt_secret.encode("utf-8"),
        f"membre:{membre_id}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    valeur = int.from_bytes(digest[:5], "big")
    return "".join(alphabet[(valeur >> (5 * i)) & 31] for i in range(8))


def membre_depuis_code(code: str, ids: list[int]) -> int | None:
    """Retrouve le membre derrière son code en balayant les ids connus.

    Les cercles restent petits (quelques dizaines de membres) : un
    balayage HMAC est plus simple et plus sûr qu'une table de codes.
    """
    code = code.strip().upper()
    for membre_id in ids:
        if code_membre(membre_id) == code:
            return membre_id
    return None
