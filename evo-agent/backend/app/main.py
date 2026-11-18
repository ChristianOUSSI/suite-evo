from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError

from .config import settings
from .database import Base, SessionLocal, engine
from .messages import refus_de_validation
from .routers import auth, exports, organisation, public
from .services.seed import seed_database

Base.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.seed_demo:
        with SessionLocal() as db:
            seed_database(db)
    yield


app = FastAPI(
    title="evo-agent",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.demo_mode else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origines,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def cle_primaire_pris(_: Request, __: IntegrityError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"code": "nom_pris", "fr": "Cette ligne existe déjà.", "en": "That line already exists."},
    )


@app.exception_handler(OperationalError)
async def base_injoignable(_: Request, __: OperationalError) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"code": "hors_ligne", "fr": "L'agent est injoignable.", "en": "The agent is unreachable."},
    )


@app.exception_handler(Exception)
async def tout_le_reste(_: Request, erreur: Exception) -> JSONResponse:
    import logging

    logging.getLogger("evo-agent").exception("incident non prévu", exc_info=erreur)
    return JSONResponse(
        status_code=500,
        content={"code": "incident", "fr": "L'agent est fermé.", "en": "The agent is closed."},
    )


@app.exception_handler(RequestValidationError)
async def validation_422(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=refus_de_validation(exc.errors()))


app.include_router(auth.router)
app.include_router(organisation.router)
app.include_router(public.router)
app.include_router(exports.router)


@app.get("/health")
def sante() -> dict:
    return {
        "status": "ok",
        "service": "evo-agent",
        "marque": "CODE AXIS DIGITAL CAMEROON",
        "demo": settings.demo_mode,
        "envoi": "aucun SMS, aucun appel, aucune tâche ne quitte cette machine",
        "langues": ["fr", "en"],
    }
