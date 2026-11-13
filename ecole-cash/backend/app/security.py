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


def creer_jeton(user_id: int, ecole_id: int) -> str:
    maintenant = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "ecole": ecole_id,
        "iat": maintenant,
        "exp": maintenant + timedelta(hours=settings.jwt_ttl_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def lire_jeton(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError:
        return None


def jeton_verif(longueur: int = 10) -> str:
    """La clé du reçu, telle qu'on la lit au téléphone à un parent."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(longueur))
