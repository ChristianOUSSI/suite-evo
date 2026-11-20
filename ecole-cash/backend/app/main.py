from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import SessionLocal, init_db
from .routers import (
    auth,
    classes,
    eleves,
    engagements,
    exports,
    paiements,
    reglages,
    relances,
    tableau,
)
from .services.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_database(db)
    yield


app = FastAPI(
    title="ÉCOLE CASH API",
    version="1.0.0",
    description=(
        "Les frais scolaires d'une école privée camerounaise : ce qui est dû, "
        "ce qui rentre, le reçu qui part tout de suite."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origine.strip()
        for origine in settings.cors_origins.split(",")
        if origine.strip()
    ],
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
app.include_router(tableau.router)
app.include_router(classes.router)
app.include_router(eleves.router)
app.include_router(engagements.router)
app.include_router(paiements.router)
app.include_router(relances.router)
app.include_router(reglages.router)
app.include_router(exports.router)


@app.get("/health", tags=["système"])
def sante() -> dict:
    return {
        "status": "ok",
        "service": "ecole-cash",
        "demo": settings.demo_mode,
        "envoi": "aucun opérateur appelé, les reçus restent dans la machine",
    }
