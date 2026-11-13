from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import SessionLocal, init_db
from .messages import refus_de_validation
from .routers import auth, exports, organisation, pointages, public
from .services.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_database(db)
    yield


app = FastAPI(
    title="evo-presence API",
    version="1.0.0",
    description=(
        "Le pointage de chantier : une ligne par homme et par jour, une paie "
        "recalculée à la demande, et un code que l'ouvrier vérifie seul. "
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

app.include_router(auth.router)
app.include_router(organisation.router)
app.include_router(pointages.router)
app.include_router(public.router)
app.include_router(exports.router)


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
        "service": "evo-presence",
        "marque": "CODE AXIS DIGITAL CAMEROON",
        "demo": settings.demo_mode,
        "envoi": "aucun SMS, aucun appel : le chantier se pointe dans cette machine",
        "langues": ["fr", "en"],
    }
