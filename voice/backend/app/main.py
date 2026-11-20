from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import SessionLocal, init_db
from .routers import (
    appointments,
    auth,
    calls,
    contacts,
    dashboard,
    dispatches,
    exports,
    knowledge,
    messages,
    settings as settings_router,
    standard,
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
    title="CADC VOICE API",
    version="1.0.0",
    description="Standard téléphonique pour universités, écoles et cliniques.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.cors_origins.split(",")
        if origin.strip()
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
app.include_router(dashboard.router)
app.include_router(standard.router)
app.include_router(knowledge.router)
app.include_router(calls.router)
app.include_router(messages.router)
app.include_router(contacts.router)
app.include_router(appointments.router)
app.include_router(dispatches.router)
app.include_router(settings_router.router)
app.include_router(exports.router)


@app.get("/health", tags=["système"])
def health() -> dict:
    return {
        "status": "ok",
        "service": "cadc-voice",
        "demo": settings.demo_mode,
        "provider": "aucun : les appels et les envois sont simulés",
    }
