# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All frontend commands run from `rock-classifier-app/frontend/`:

```bash
npm install
npm run dev      # Vite dev server on :5173, proxies /api -> localhost:8000
npm run build    # tsc && vite build — tsc runs first, so ANY type error fails the build
npm run preview
```

Backend, from `rock-classifier-app/backend/`:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000     # docs at /docs
```

Docker image for the inference service, from `rock-classifier-app/`:

```bash
docker build -t rock-classifier-api -f Dockerfile .
```

`requirements.txt` pins pytest/pytest-asyncio but `backend/tests/` contains only
`__init__.py` — there is no test suite yet.

## Deployment split (the central constraint)

The app deploys as **two services**, and this is not a preference — PyTorch cannot
run on Vercel. The `torch` wheel alone exceeds Vercel's 250 MB serverless function
limit. Do not try to move the backend into `api/` functions.

- **Frontend → Vercel.** Root `vercel.json` drives the build; it uses `--prefix` to
  reach into `rock-classifier-app/frontend`, so the repo needs no Root Directory
  setting in the dashboard.
- **Backend → container host** (Render blueprint in `render.yaml`, or any Docker
  platform). Binds `$PORT`; the Dockerfile installs CPU-only torch from
  `download.pytorch.org/whl/cpu` to keep the image ~1 GB instead of >5 GB.

The two are wired by two env vars that must agree:
`VITE_API_URL` (frontend → backend, **baked in at build time**, so changing it
requires a redeploy) and `FRONTEND_URL` (backend CORS → frontend origin).

## Architecture notes

**API contract.** `POST /api/classify/rock` returns
`{primary: RockInfo, alternatives: AlternativeMatch[], inference_time_ms}`.
`RockInfo` is serialized with the field alias `class` (FastAPI defaults to
`response_model_by_alias=True`), which is why the TS type uses `class` and not
`rock_class`. Every route is mounted under `/api`; `src/api/client.ts` normalizes
`VITE_API_URL` so both `https://host` and `https://host/api` work.

**Graceful degradation is load-bearing.** `isApiConfigured` in `client.ts` is
`false` when `VITE_API_URL` is unset in a production build. The Catalog and About
sections are driven by data bundled at build time and work without any backend;
only the classifier depends on it. Keep this property — it's what makes a Vercel
deploy succeed standalone.

**Rock data is duplicated in three places**, deliberately or not, and they drift:
`backend/app/routers/classify.py` (`ROCK_DATABASE`, full geology, used to enrich
predictions), `backend/app/routers/reference.py` (`ROCKS_DATABASE`, abridged), and
`frontend/src/components/RockCatalog.tsx` (`ROCK_CATALOG`, with emoji/category, and
the only one the Catalog UI actually reads — it does not call the API). Editing rock
facts means touching all three.

**Model weights ARE tracked**, via a negation in both `.gitignore` files
(`!models/rock_classifier.pt`, 44 MB) — the Dockerfile does `COPY models/`, so
untracked weights would produce an image whose API returns noise. The 168 MB
`checkpoint_last.pt` (resume state, includes optimiser) stays excluded, and
`.gitattributes` marks `*.pt binary` so no checkout applies line-ending conversion
to it. `RockClassifier` detects the architecture from the checkpoint
(`resnet18_transfer` here) and, if weights are ever missing, silently falls back to
an ImageNet backbone with a random head — the API still answers, but with noise.
Check for "weights not found" in the logs before debugging accuracy.

**The model is loaded once at startup** (FastAPI lifespan). Replacing
`rock_classifier.pt` under a running server changes nothing until the process
restarts, with no error to indicate it.

**Current model**: ResNet18 transfer, 40.6% top-1 / 70.8% top-5 on a 298-image
stratified hold-out. Per-class performance is very uneven (Chalk 83% F1, Pumice 0%)
and tracks the class sizes in `metrics.json` → `dataset_counts`.

**About page metrics.** `AboutPage.tsx` ships hardcoded per-class metrics as a
fallback and overrides them from `GET /api/model/metrics` at runtime. The backend
serves `metrics.json` from `MODELS_DIR`; it is tracked and carries the confusion
matrix, top-k accuracy, macro/weighted averages and per-class dataset counts that
four About sections render. Sections hide themselves when the field is absent.

**The training dataset is not tracked** (~150 MB); `backend/train/download_commons.py`
regenerates it from Wikimedia Commons and is resumable via `dataset/MANIFEST.json`,
which *is* tracked and records each image's licence and author.

**`backend/app/database/` is dead code.** `connection.py`, `crud.py` and
`models/database.py` define a SQLAlchemy layer nothing imports; no tables are created
and no `.db` file exists. The real rock data are the Python dicts described above.

**Rate limiting** (`utils/rate_limiter.py`) is in-process and per-IP, resolved from
`X-Forwarded-For` because hosted platforms put a proxy in front. It is skipped for
`OPTIONS` so CORS preflight is never throttled. In-process state means the limit is
per instance and resets on deploy.
