"""
POST /api/classify/rock — rock classification on Vercel.

Runs onnxruntime instead of PyTorch: the torch wheel alone exceeds Vercel's
250 MB serverless limit, while onnxruntime + numpy + Pillow + this model come to
roughly 135 MB. The ONNX graph is a format conversion of the trained checkpoint,
verified to agree with PyTorch to ~3e-06 on the logits.

Response shape is identical to the FastAPI backend so the frontend is unchanged:
    {primary: RockInfo, alternatives: [...], inference_time_ms: int}
"""

import email
import io
import json
import os
import time
from http.server import BaseHTTPRequestHandler

import numpy as np
import onnxruntime as ort
from PIL import Image

LIB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_lib")

MAX_BYTES = 5 * 1024 * 1024
ALLOWED_EXT = (".jpg", ".jpeg", ".png", ".webp")
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)

# Module-level so a warm invocation reuses them; only a cold start pays the
# ~45 MB model load.
_session = None
_classes = None
_rocks = None


def _load():
    global _session, _classes, _rocks
    if _session is None:
        _session = ort.InferenceSession(
            os.path.join(LIB, "rock_classifier.onnx"),
            providers=["CPUExecutionProvider"],
        )
        with open(os.path.join(LIB, "rock_classes.json")) as fh:
            _classes = json.load(fh)
        with open(os.path.join(LIB, "rocks.json"), encoding="utf-8") as fh:
            _rocks = json.load(fh)
    return _session, _classes, _rocks


def parse_multipart_file(body: bytes, content_type: str):
    """
    Pull the 'file' part out of a multipart body using stdlib `email`.

    Deliberately not `cgi.FieldStorage`: that module was removed in Python 3.13
    and the Vercel runtime's Python version is not under our control here.

    Returns (bytes, filename) or (None, None).
    """
    if "multipart/form-data" not in (content_type or ""):
        return None, None

    message = email.message_from_bytes(
        b"Content-Type: " + content_type.encode() + b"\r\nMIME-Version: 1.0\r\n\r\n" + body
    )
    fallback = (None, None)
    for part in message.walk():
        if part.get_content_maintype() == "multipart":
            continue
        name = part.get_param("name", header="content-disposition")
        payload = part.get_payload(decode=True)
        if payload is None:
            continue
        filename = part.get_filename()
        if name == "file":
            return payload, filename
        if filename and fallback[0] is None:
            fallback = (payload, filename)
    return fallback


def preprocess(raw: bytes) -> np.ndarray:
    """Resize(256) -> CenterCrop(224) -> normalise, matching the val transform."""
    img = Image.open(io.BytesIO(raw))
    img.verify()
    img = Image.open(io.BytesIO(raw)).convert("RGB")

    w, h = img.size
    scale = 256 / min(w, h)
    img = img.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.BILINEAR)

    w, h = img.size
    left, top = (w - 224) // 2, (h - 224) // 2
    img = img.crop((left, top, left + 224, top + 224))

    arr = np.asarray(img, dtype=np.float32).transpose(2, 0, 1) / 255.0
    arr = (arr - IMAGENET_MEAN) / IMAGENET_STD
    return arr[None, ...]


def classify(raw: bytes) -> dict:
    session, classes, rocks = _load()
    start = time.time()

    logits = session.run(None, {"input": preprocess(raw)})[0][0]
    exp = np.exp(logits - logits.max())
    probs = exp / exp.sum()

    order = np.argsort(probs)[::-1][:5]
    primary_idx = int(order[0])
    primary_name = classes[primary_idx]

    primary = dict(rocks.get(primary_name, {"class": primary_name}))
    primary["class"] = primary_name
    primary["confidence"] = float(probs[primary_idx])

    return {
        "primary": primary,
        "alternatives": [
            {"class": classes[int(i)], "confidence": float(probs[int(i)])}
            for i in order[1:]
        ],
        "inference_time_ms": int((time.time() - start) * 1000),
    }


class handler(BaseHTTPRequestHandler):
    def _send(self, status: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0:
                return self._send(400, {"detail": "Empty request body."})
            if length > MAX_BYTES + 8192:
                return self._send(413, {"detail": "File too large. Max size: 5.0MB"})

            raw, filename = parse_multipart_file(
                self.rfile.read(length), self.headers.get("Content-Type", "")
            )
            if raw is None:
                return self._send(400, {"detail": "No file uploaded under field 'file'."})

            filename = (filename or "").lower()
            if filename and not filename.endswith(ALLOWED_EXT):
                ext = os.path.splitext(filename)[1] or "unknown"
                return self._send(400, {
                    "detail": f"Invalid file type: {ext}. Allowed: {', '.join(ALLOWED_EXT)}"
                })

            if len(raw) > MAX_BYTES:
                return self._send(413, {"detail": "File too large. Max size: 5.0MB"})

            try:
                result = classify(raw)
            except Exception:
                return self._send(400, {"detail": "Invalid image file."})

            return self._send(200, result)
        except Exception as exc:  # never leak a stack trace to the client
            return self._send(500, {"detail": f"Classification failed: {type(exc).__name__}"})

    def do_GET(self):
        self._send(405, {"detail": "Use POST with a multipart 'file' field."})
