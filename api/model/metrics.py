"""
GET /api/model/metrics — training metrics for the About page.

Serves the metrics.json produced by backend/train/train_v2.py: per-class
precision/recall/F1, the confusion matrix, top-k accuracy and the dataset
composition. The About page falls back to bundled numbers if this 404s.
"""

import json
import os
from http.server import BaseHTTPRequestHandler

LIB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_lib")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = os.path.join(LIB, "metrics.json")
        try:
            with open(path, encoding="utf-8") as fh:
                payload = fh.read().encode()
            status = 200
        except FileNotFoundError:
            payload = json.dumps({"detail": "metrics.json not found"}).encode()
            status = 404

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(payload)
