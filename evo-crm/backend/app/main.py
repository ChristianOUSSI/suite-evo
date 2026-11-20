from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import SessionLocal, init_db
from .messages import refus_de_validation
from .routers import auth, carnet, exports, fiches, public, relances
from .services.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_database(db)
    yield


app = FastAPI(
    title="evo-crm API",
    version="1.0.0",
    description=(
        "Le carnet qui se souvient : chaque client a sa fiche, chaque devis "
        "ouvre une reprise, et le gérant sait ce matin qui rappeler. "
        "CODE AXIS DIGITAL CAMEROON."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origines,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def entetes_securite(request: Request, suite):
    """Les en-têtes qu'un navigateur sérieux attend : pas de mime deviné,
    pas d'encadrement, pas de référent qui fuit."""
    reponse = await suite(request)
    reponse.headers.setdefault("X-Content-Type-Options", "nosniff")
    reponse.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    reponse.headers.setdefault("Referrer-Policy", "no-referrer")
    return reponse

app.include_router(auth.router)
app.include_router(carnet.router)
app.include_router(fiches.router)
app.include_router(relances.router)
app.include_router(exports.router)
app.include_router(public.router)


@app.exception_handler(RequestValidationError)
def saisie_traduite(_: object, erreur: RequestValidationError) -> JSONResponse:
    """Les 422 de validation passent par les deux langues, comme nos refus."""
    return JSONResponse(
        status_code=422,
        content={"detail": refus_de_validation(list(erreur.errors()))},
    )


@app.get("/health", tags=["système"])
def sante() -> dict:
    return {
        "status": "ok",
        "service": "evo-crm",
        "marque": "CODE AXIS DIGITAL CAMEROON",
        "demo": settings.demo_mode,
        "envoi": "aucun SMS, aucun appel : le carnet tourne dans cette machine",
        "langues": ["fr", "en"],
    }
