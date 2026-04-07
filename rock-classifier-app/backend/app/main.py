"""
Main FastAPI application for Rock Classifier.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from .config import ALLOWED_ORIGINS, API_HOST, API_PORT, API_RELOAD, LOG_LEVEL, MODELS_DIR
import json
from .utils.model_loader import load_rock_model
from .routers import classify, reference

# Configure logging
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events. Loads ML models at startup."""
    logger.info("Rock Classifier API starting...")
    try:
        app.state.rock_classifier = load_rock_model()
        logger.info("Rock classification model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load rock classifier: {e}")
        raise

    yield

    logger.info("Rock Classifier API shutting down...")


app = FastAPI(
    title="Rock Classifier API",
    description="Deep Learning API for rock classification from images",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(classify.router, prefix="/api/classify", tags=["Classification"])
app.include_router(reference.router, prefix="/api/reference", tags=["Reference Data"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "rock-classifier-api", "version": "1.0.0"}


@app.get("/api/model/metrics")
async def get_model_metrics():
    """Return model training metrics saved as JSON in the models directory."""
    metrics_path = MODELS_DIR / "metrics.json"
    if not metrics_path.exists():
        return JSONResponse(status_code=404, content={"detail": "metrics.json not found"})
    try:
        with open(metrics_path, "r") as fh:
            data = json.load(fh)
        return data
    except Exception as e:
        logger.error(f"Failed to read metrics.json: {e}")
        return JSONResponse(status_code=500, content={"detail": "Failed to read metrics file"})


@app.get("/")
async def root():
    return {
        "service": "Rock Classifier API",
        "documentation": "/docs",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "classify": "/api/classify/rock",
            "reference": "/api/reference/rocks",
        },
    }


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "type": type(exc).__name__},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=API_HOST, port=API_PORT, reload=API_RELOAD)
