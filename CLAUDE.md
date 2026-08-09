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

**Three copies of the val transform must agree**, and equivalence of the *weights*
does not imply equivalence of the *pipeline*. `train_v2.py`'s `val_transform`,
`RockClassifier.transform`, and `preprocess()` in `api/classify/rock.py` all have
to be `Resize(256) + CenterCrop(224)` — the transform the 40.6 % was measured on.
The numpy/PIL reimplementation in `rock.py` is the delicate one: torchvision
`Resize(int)` **truncates** the long side (`int(256 * long / short)`, and `w <= h`
means `w` is the short side), while `CenterCrop` offsets by `int(round(margin/2))`,
**not** `margin // 2`. Using `round()` for the resize or `//` for the crop shifts
the crop by 1 px on roughly half of real images and moves confidences by up to
0.15 without changing the predicted class — invisible to a spot check, and enough
to make the hold-out metrics irreproducible. To verify a change here, compare
`preprocess()` against the torchvision pipeline directly: it should be **bit
identical** (max diff exactly 0.0), not merely close.

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

**`MANIFEST.json` is the licence record, and it has to stay complete.** It is the
only proof of provenance in the repo — the images themselves are not tracked, so
if an entry is missing or blank there is nothing else to fall back on. As audited,
all **1481** entries carry a licence and a source URL, every one resolves to
`commons.wikimedia.org`, and the per-class counts match `metrics.json` →
`dataset_counts` exactly. That equality is what proves the trained model saw only
these images; check it after any dataset change.

Attribution is not optional for most of the corpus: CC0 (555) and public domain
(72) do not require credit, but CC BY and CC BY-SA — the majority — do. An entry
with an empty `artist` under one of those licences is a licence violation, not a
cosmetic gap. Nine such blanks were repaired by re-querying the Commons API with
the `source` URL each entry already stores; that is the recovery route if it
happens again. Where Commons flags `AttributionRequired` but declares no author,
the record names the **uploader** and says so explicitly — never invent an author
the source does not assert.

**Search-engine scrapers were deliberately removed.** `download_images.py`
(DuckDuckGo), `download_bing.py` and `clean_and_augment.py` (icrawler), plus the
ResNet50 `train_model.py` they fed, were superseded and deleted — they are in git
history if ever needed. They produced images with **no licence and no author**,
which would silently break the guarantee above the moment anyone ran them, since
nothing downstream re-checks provenance. `download_commons.py` is the only
sanctioned way to add images. Do not reintroduce scraping without also recording
licence, author and source per file.

**About page metrics.** `AboutPage.tsx` ships hardcoded per-class metrics as a
fallback and overrides them from `GET /api/model/metrics`. The fallback mirrors
`api/_lib/metrics.json`, so the offline view cannot report a different training
run than the online one — regenerate it from that file after retraining. Four
sections (dataset balance, confusion matrix, top-k, macro-vs-weighted) render
only when the corresponding field is present, and hide themselves otherwise.

**`python-multipart` looks unused and is not.** It is never imported by name,
but FastAPI needs it to parse `UploadFile`/`File()`. Dropping it from
`backend/requirements.txt` breaks `POST /api/classify/rock` at request time, not
at import time, so neither a linter nor a startup check catches it. The
SQLAlchemy layer that used to sit in `backend/app/database/` was genuinely dead
and has been removed, along with `resize_image()` (which squashed to 224×224 and
so contradicted the val transform above).

**The API answers in English.** `detail` strings from `api/` are not localised,
and neither is the axios failure mode. `api/client.ts` therefore classifies
failures into an `ApiErrorKind` and the component picks the wording, since only
it knows the active locale — never render `err.message` to a user. `ui.errors`
is typed `Record<ApiErrorKind, Localized<string>>`, so a new kind without a
translation fails the build.
