import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
from threading import Lock


def client_ip(request: Request) -> str:
    """
    Resolve the caller's IP.

    Hosted platforms (Render, Railway, Fly) terminate TLS at a proxy, so
    `request.client.host` is the proxy for every caller — without this, all
    users would share a single rate-limit bucket.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        # Left-most entry is the original client.
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    return request.client.host if request.client else "unknown"


class SimpleRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # ip -> [timestamps]
        self.lock = Lock()

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        with self.lock:
            timestamps = [t for t in self.requests[ip] if now - t < self.window_seconds]

            if len(timestamps) >= self.max_requests:
                self.requests[ip] = timestamps
                return False

            timestamps.append(now)
            self.requests[ip] = timestamps
            self._evict_idle(now)
            return True

    def _evict_idle(self, now: float) -> None:
        """Drop buckets with no recent activity so the map cannot grow unbounded."""
        stale = [
            ip
            for ip, timestamps in self.requests.items()
            if not timestamps or now - timestamps[-1] >= self.window_seconds
        ]
        for ip in stale:
            del self.requests[ip]


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        super().__init__(app)
        self.limiter = SimpleRateLimiter(max_requests, window_seconds)

    async def dispatch(self, request: Request, call_next):
        # CORS preflight carries no credentials and must never be throttled,
        # otherwise the browser blocks the real request.
        if request.method == "OPTIONS":
            return await call_next(request)

        if not self.limiter.is_allowed(client_ip(request)):
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Try again later."},
            )

        return await call_next(request)
