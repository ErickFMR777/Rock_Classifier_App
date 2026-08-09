"""
Configuration file for Rock Classifier Backend.
Centralizes all settings: paths, ports, model parameters, etc.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ==================== DIRECTORIES ====================
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(BASE_DIR.parent / "models")))

# ==================== API CONFIGURATION ====================
API_HOST = os.getenv("API_HOST", "0.0.0.0")
# Render/Railway/Fly inject the port to bind as $PORT; fall back to API_PORT locally.
API_PORT = int(os.getenv("PORT") or os.getenv("API_PORT") or 8000)
# Auto-reload must stay off in production; opt in explicitly for local development.
API_RELOAD = os.getenv("API_RELOAD", "false").lower() == "true"

# ==================== ML MODELS ====================
ROCK_MODEL_PATH = MODELS_DIR / "rock_classifier.pt"
ROCK_CLASSES_PATH = MODELS_DIR / "rock_classes.json"

# Model parameters
IMAGE_SIZE = 224  # the network's input resolution, after Resize(256)+CenterCrop
MODEL_DEVICE = "cpu"

# ==================== IMAGE PROCESSING ====================
IMAGE_MAX_SIZE = 5 * 1024 * 1024  # 5MB max file size
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# The ImageNet normalisation constants deliberately do NOT live here: the val
# transform is defined once in RockClassifier.transform, and a second copy of
# the numbers invites the two from drifting apart.

# ==================== CORS SETTINGS ====================
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Add Codespaces origins dynamically
codespace_name = os.getenv("CODESPACE_NAME")
if codespace_name:
    github_domain = os.getenv("GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN", "app.github.dev")
    ALLOWED_ORIGINS.append(f"https://{codespace_name}-5173.{github_domain}")
    ALLOWED_ORIGINS.append(f"https://{codespace_name}-8000.{github_domain}")

# Production frontend origin(s). FRONTEND_URL holds the primary Vercel domain;
# ALLOWED_ORIGINS accepts a comma-separated list for custom domains.
FRONTEND_URL = os.getenv("FRONTEND_URL")
if FRONTEND_URL:
    ALLOWED_ORIGINS.append(FRONTEND_URL.rstrip("/"))

_extra_origins = os.getenv("ALLOWED_ORIGINS", "")
ALLOWED_ORIGINS.extend(
    origin.strip().rstrip("/") for origin in _extra_origins.split(",") if origin.strip()
)

# De-duplicate while preserving order.
ALLOWED_ORIGINS = list(dict.fromkeys(ALLOWED_ORIGINS))

# Vercel mints a new domain for every preview deployment, so an exact-match list
# can never cover them. This regex allows preview URLs of the project without
# opening CORS up to the whole internet. Override with VERCEL_PREVIEW_REGEX,
# or set it empty to allow only the exact origins listed above.
ALLOWED_ORIGIN_REGEX = os.getenv(
    "VERCEL_PREVIEW_REGEX", r"^https://.*\.vercel\.app$"
) or None

# ==================== LOGGING ====================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
