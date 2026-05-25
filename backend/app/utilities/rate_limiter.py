import time
from collections import defaultdict, deque
from dataclasses import dataclass, field
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response


@dataclass
class InMemoryRateLimiter:
    max_requests: int
    window_seconds: int = 60
    buckets: dict[str, deque[float]] = field(default_factory=lambda: defaultdict(deque))

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        bucket = self.buckets[key]
        while bucket and now - bucket[0] > self.window_seconds:
            bucket.popleft()
        if len(bucket) >= self.max_requests:
            return False
        bucket.append(now)
        return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limiter: InMemoryRateLimiter) -> None:
        super().__init__(app)
        self.limiter = limiter

    async def dispatch(self, request: Request, call_next) -> Response:
        client = request.client.host if request.client else "unknown"
        if not self.limiter.allow(client):
            return JSONResponse(
                status_code=429,
                content={"success": False, "message": "Too many requests", "data": None},
            )
        return await call_next(request)
