from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import SessionLocal, init_db
from .routers import auth, caisse, comptoir, ecritures, exports
from .services.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_database(db)
    yield


app = FastAPI(
    title="KOLO BOUTIQUE API",
    version="1.0.0",
    description=(
        "Le cahier d'une boutique de quartier : ce qui entre, ce qui sort, "
        "le bénéfice de la journée, tenu par un vocal WhatsApp."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origines_autorisees,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def entetes_securite(request: Request, suite):
    """Pas de mime deviné, pas d'encadrement, pas de référent qui fuit."""
    reponse = await suite(request)
    reponse.headers.setdefault("X-Content-Type-Options", "nosniff")
    reponse.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    reponse.headers.setdefault("Referrer-Policy", "no-referrer")
    return reponse


app.include_router(auth.router)
app.include_router(comptoir.router)
app.include_router(ecritures.router)
app.include_router(caisse.router)
app.include_router(exports.router)


@app.get("/health", tags=["système"])
def sante() -> dict:
    return {
        "status": "ok",
        "service": "kolo-boutique",
        "demo": settings.demo_mode,
        "envoi": "aucun vocal WhatsApp reçu, aucun débit MoMo : tout reste dans la machine",
    }
