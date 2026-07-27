# FastAPI + PyTorch inference service.
#
# This image exists because the backend cannot run on Vercel: the torch wheel
# alone is larger than Vercel's 250 MB serverless function limit. Deploy this
# to Render / Railway / Fly.io / Hugging Face Spaces and point the frontend's
# VITE_API_URL at the resulting URL.
#
# Build context is `rock-classifier-app/`:
#   docker build -t rock-classifier-api -f Dockerfile .

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY backend/requirements.txt ./requirements.txt

# Install CPU-only torch first. The default PyPI wheels bundle CUDA and push the
# image past 5 GB; the cpu index keeps it near 1 GB, which fits free tiers.
RUN pip install --no-cache-dir \
        torch==2.2.0 torchvision==0.17.0 \
        --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY models/ ./models/

ENV MODELS_DIR=/app/models \
    API_RELOAD=false

WORKDIR /app/backend

EXPOSE 8000

# $PORT is injected by Render/Railway/Fly; default keeps local `docker run` working.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
