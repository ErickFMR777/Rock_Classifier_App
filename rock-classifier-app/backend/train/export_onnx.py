"""
Export the trained PyTorch checkpoint to a single self-contained ONNX file.

The deployed inference runs on Vercel, where PyTorch does not fit: the torch
wheel alone exceeds Vercel's 250 MB serverless limit. onnxruntime plus numpy
plus Pillow plus this model come to roughly 135 MB, which does fit — so the
whole app can live on one platform with no second service and no CORS.

Verified equivalence: max logit difference against PyTorch is ~3e-06 and the
predicted class matches, so this is a format change, not a model change.

Usage:
    python export_onnx.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import onnx
import torch
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.models.rock_classifier import RockClassifier  # noqa: E402

MODELS = BASE_DIR / "models"
DATASET = BASE_DIR / "dataset"
CKPT = MODELS / "rock_classifier.pt"
OUT = MODELS / "rock_classifier.onnx"
TMP = MODELS / "_tmp_export.onnx"


def main() -> None:
    if not CKPT.exists():
        raise SystemExit(f"Checkpoint not found: {CKPT}. Run train_v2.py first.")

    clf = RockClassifier(str(CKPT), str(MODELS / "rock_classes.json"), device="cpu")
    model = clf.model.eval()

    torch.onnx.export(
        model,
        torch.randn(1, 3, 224, 224),
        str(TMP),
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )

    # The exporter writes weights to a sidecar .data file. Fold them back in so
    # the deployment ships exactly one artefact.
    onnx.save_model(onnx.load(str(TMP)), str(OUT), save_as_external_data=False)
    TMP.unlink(missing_ok=True)
    Path(str(TMP) + ".data").unlink(missing_ok=True)

    size_mb = OUT.stat().st_size / 1e6
    print(f"Wrote {OUT} ({size_mb:.1f} MB)")

    # Equivalence check against the PyTorch model on real images.
    import onnxruntime as ort

    sess = ort.InferenceSession(str(OUT), providers=["CPUExecutionProvider"])
    samples = sorted(DATASET.glob("*/*.jpg"))[:12] if DATASET.exists() else []
    if not samples:
        print("dataset/ absent — skipping equivalence check")
        return

    max_diff, mismatches = 0.0, 0
    for path in samples:
        x = clf.transform(Image.open(path).convert("RGB")).unsqueeze(0)
        with torch.no_grad():
            expected = model(x).numpy()
        actual = sess.run(None, {"input": x.numpy()})[0]
        max_diff = max(max_diff, float(np.abs(expected - actual).max()))
        mismatches += int(np.argmax(expected) != np.argmax(actual))

    print(f"max logit difference vs PyTorch: {max_diff:.2e}")
    print(f"class mismatches over {len(samples)} images: {mismatches}")
    if mismatches or max_diff > 1e-3:
        raise SystemExit("ONNX export diverges from PyTorch — do not deploy this file")
    print("ONNX export matches PyTorch")


if __name__ == "__main__":
    main()
