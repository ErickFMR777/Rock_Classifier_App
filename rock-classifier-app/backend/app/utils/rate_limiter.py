import time
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from collections import defaultdict
from threading import Lock

class SimpleRateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)  # ip -> [timestamps]
        self.lock = Lock()

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        with self.lock:
            timestamps = self.requests[ip]
            # Remove timestamps outside window
            self.requests[ip] = [t for t in timestamps if now - t < self.window_seconds]
            if len(self.requests[ip]) < self.max_requests:
                self.requests[ip].append(now)
                return True
            return False

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 30, window_seconds: int = 60):
        super().__init__(app)
        self.limiter = SimpleRateLimiter(max_requests, window_seconds)

    async def dispatch(self, request: Request, call_next):
        ip = request.client.host
        if not self.limiter.is_allowed(ip):
            return JSONResponse(
                status_code=429,
                content={"success": False, "error": "Rate limit exceeded. Try again later."}
            )
        return await call_next(request)
