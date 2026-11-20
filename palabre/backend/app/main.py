from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import SessionLocal, init_db
from .routers import auth, dashboard, invoices, payments, public, reminders, settings as settings_router
from .services.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_database(db)
    yield


app = FastAPI(
    title="PALABRE API",
    version="1.0.0",
    description="Recouvrement commercial, relances et paiements MoMo.",
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
app.include_router(invoices.router)
app.include_router(reminders.router)
app.include_router(payments.router)
app.include_router(settings_router.router)
app.include_router(public.router)


@app.get("/health", tags=["système"])
def health() -> dict:
    return {"status": "ok", "service": "palabre", "demo": settings.demo_mode}
