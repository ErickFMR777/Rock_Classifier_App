# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Live: https://rock-classifier-app-erickfmr777s-projects.vercel.app

## Commands

Frontend, from `rock-classifier-app/frontend/`:

```bash
npm install
npm run dev      # Vite on :5173, proxies /api -> localhost:8000
npm run build    # tsc && vite build — tsc runs first, so ANY type error fails the build
```

Training and data, from `rock-classifier-app/backend/train/`:

```bash
python download_commons.py [--topup] [Class ...]   # rebuild dataset/
python train_v2.py                                 # ~156 min CPU, writes .pt + metrics.json
python export_onnx.py                              # writes .onnx, aborts if it diverges from torch
```

Deploy (repo is git-connected, so a push to `main` deploys automatically):

```bash
vercel deploy --prod
vercel api "/v9/projects/<id>?teamId=<team>"       # read/patch project settings
```

`requirements.txt` at the repo root is for the **Vercel functions**;
`rock-classifier-app/backend/requirements.txt` is the local FastAPI/PyTorch stack.
`backend/tests/` contains only `__init__.py` — there is no test suite.

## Architecture: one Vercel deployment, two codebases for inference

Everything runs in a single Vercel project. **`api/` is what production executes**;
`rock-classifier-app/backend/` is the FastAPI+PyTorch implementation kept for local
development and as a container fallback (`Dockerfile`, `render.yaml`). They
implement the same HTTP contract and can drift — change both or neither.

Production inference is `api/classify/rock.py` running **onnxruntime**, not torch:
the torch wheel alone exceeds Vercel's 250 MB function limit, while onnxruntime +
numpy + pillow + the 45 MB model come to ~146 MB. The ONNX graph is a format
conversion of the trained checkpoint, not a different model — `export_onnx.py`
verifies logits agree to ~3e-06 and **exits non-zero if they diverge**.

`api/_lib/` holds the deployed artefacts (`rock_classifier.onnx`,
`rock_classes.json`, `metrics.json`, `rocks.json`) and is pulled into the function
bundle via `includeFiles` in `vercel.json`. **After retraining, copy the new
`.onnx` and `metrics.json` from `models/` into `api/_lib/`** — nothing does this
automatically.

## Things that will bite you

**Vercel project settings live outside the repo** and caused 14 hours of failing
builds. `rootDirectory` must be empty (it was `rock-classifier-app/backend`, which
made the install command resolve to a duplicated non-existent path), `framework`
must be null (it was `fastapi`), and `ssoProtection` must be off or the whole app
sits behind a Vercel login. No code change fixes these; patch them via `vercel api`.

**The Vercel runtime is CPython 3.12.** onnxruntime only ships `cp312` manylinux
wheels from 1.24 onward, so older pins fail dependency resolution at build time.
Multipart parsing uses stdlib `email`, deliberately not `cgi` — that module was
removed in 3.13 and would break the function on a runtime bump.

**The SPA rewrite in `vercel.json` excludes `/api/`.** A plain `/(.*)` catch-all
swallows API calls and returns HTML instead.

**Model weights are tracked**, via negations in both `.gitignore` files:
`rock_classifier.pt` (44 MB, training artefact) and `rock_classifier.onnx` (45 MB,
what deploys). `checkpoint_last.pt` (168 MB, carries optimiser state) is excluded.
`.gitattributes` marks `*.pt`/`*.onnx` as binary so no checkout applies line-ending
conversion and silently corrupts them.

**If the container path is ever used**: the model loads once at FastAPI startup, so
replacing weights under a running server changes nothing until the process
restarts, with no error to indicate it. This bit during verification — the app
served noise from stale in-memory weights while the correct file sat on disk.

## Data and model notes

**Current model**: ResNet18 transfer, 40.6 % top-1 / 70.8 % top-5 on a 298-image
stratified hold-out, 57–152 ms per inference in production. Per-class performance
is very uneven (Chalk 83 % F1, Pumice 0 %) and tracks class size in `metrics.json`
→ `dataset_counts`.

**The train/val split is stratified by hand**, not `random_split` — the latter gave
Basalt 11 % and Quartzite 34 % validation instead of 20 %, which both distorted the
per-class metrics and added an unintended second imbalance.

**`api/_lib/rocks.json` is the single source** for rock geology, read by both the
catalogue endpoint and the prediction enrichment. `RockCatalog.tsx` still carries
its own hardcoded copy with emoji/category and does not call the API, so editing
rock facts means touching both. `backend/app/routers/` also has the original dicts
that `rocks.json` was extracted from.

**The dataset is not tracked** (~150 MB). `download_commons.py` rebuilds it from
Wikimedia Commons and is resumable via `dataset/MANIFEST.json`, which *is* tracked
and records each image's licence and author. Its filtering is load-bearing: Commons
category listings are dominated by landscapes and buildings, and GeoDIL titles a
thin section identically to a hand sample — only the description and categories
distinguish them.

**About page metrics.** `AboutPage.tsx` ships hardcoded per-class metrics as a
fallback and overrides them from `GET /api/model/metrics`. Four sections (dataset
balance, confusion matrix, top-k, macro-vs-weighted) render only when the
corresponding field is present, and hide themselves otherwise.

**`backend/app/database/` is dead code.** `connection.py`, `crud.py` and
`models/database.py` define a SQLAlchemy layer nothing imports; no tables are
created and no `.db` file exists.
