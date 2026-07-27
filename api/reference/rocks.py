"""
GET /api/reference/rocks — the rock catalogue.

Reads api/_lib/rocks.json, the same file the classifier uses to enrich a
prediction, so the catalogue and the result screen can never disagree.
"""

import json
import os
from http.server import BaseHTTPRequestHandler

LIB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "_lib")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with open(os.path.join(LIB, "rocks.json"), encoding="utf-8") as fh:
                rocks = json.load(fh)
            payload = json.dumps({
                "rocks": [
                    {
                        "id": i,
                        "name": name,
                        "type": data.get("type", "Unknown"),
                        "color": data.get("color", "Variable"),
                        "grain_size": data.get("grain_size", ""),
                        "description": data.get("description", ""),
                    }
                    for i, (name, data) in enumerate(sorted(rocks.items()), 1)
                ],
                "total": len(rocks),
            }).encode()
            status = 200
        except Exception:
            payload = json.dumps({"detail": "Reference data unavailable"}).encode()
            status = 500

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(payload)
