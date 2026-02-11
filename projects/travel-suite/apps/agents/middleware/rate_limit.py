"""
Rate limiting middleware for FastAPI
Implements token bucket algorithm with configurable limits per endpoint
"""
import time
from typing import Dict, Tuple, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse


class RateLimiter:
    """
    Token bucket rate limiter.

    Tracks requests per client (IP address) and enforces rate limits.
    Supports different limits for different endpoints.
    """

    def __init__(self):
        # Format: {client_ip: {endpoint: (tokens, last_refill_time)}}
        self.buckets: Dict[str, Dict[str, Tuple[float, float]]] = {}
        # Default limits: requests per minute
        self.default_limit = 100  # 100 requests per minute
        self.default_window = 60  # 60 seconds

        # Per-endpoint overrides
        self.endpoint_limits = {
            "/api/chat/trip-planner": (20, 60),      # 20 requests per minute
            "/api/chat/support": (30, 60),           # 30 requests per minute
            "/api/chat/recommend": (30, 60),         # 30 requests per minute
            "/api/health": (1000, 60),               # 1000 requests per minute (health checks)
        }

    def get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, considering proxies."""
        # Check for forwarded headers (for proxied requests)
        if request.headers.get("x-forwarded-for"):
            return request.headers.get("x-forwarded-for").split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def get_limits(self, path: str) -> Tuple[int, int]:
        """Get rate limit for a given endpoint path."""
        # Check for exact match
        if path in self.endpoint_limits:
            return self.endpoint_limits[path]

        # Check for prefix match
        for endpoint_pattern, limits in self.endpoint_limits.items():
            if path.startswith(endpoint_pattern):
                return limits

        # Return default limit
        return (self.default_limit, self.default_window)

    def is_allowed(self, client_ip: str, path: str) -> Tuple[bool, Dict[str, any]]:
        """
        Check if request is allowed under rate limit.

        Returns: (allowed: bool, info: dict with headers)
        """
        limit, window = self.get_limits(path)
        current_time = time.time()

        # Initialize bucket if not exists
        if client_ip not in self.buckets:
            self.buckets[client_ip] = {}

        if path not in self.buckets[client_ip]:
            # New endpoint: initialize with full tokens
            self.buckets[client_ip][path] = (float(limit), current_time)

        tokens, last_refill = self.buckets[client_ip][path]

        # Calculate refill
        time_passed = current_time - last_refill
        refill_rate = limit / window  # tokens per second
        tokens = min(limit, tokens + time_passed * refill_rate)

        # Check if we can fulfill the request
        allowed = tokens >= 1

        if allowed:
            tokens -= 1

        # Update bucket
        self.buckets[client_ip][path] = (tokens, current_time)

        # Prepare response headers
        remaining = max(0, int(tokens))
        reset_time = int(current_time) + window

        info = {
            "X-RateLimit-Limit": str(limit),
            "X-RateLimit-Window": str(window),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_time),
        }

        return allowed, info

    def cleanup_old_entries(self, max_age: int = 3600):
        """
        Remove old entries older than max_age seconds.
        Call periodically to prevent memory leak.
        """
        current_time = time.time()
        ips_to_remove = []

        for client_ip, endpoints in self.buckets.items():
            endpoints_to_remove = []

            for path, (tokens, last_refill) in endpoints.items():
                if current_time - last_refill > max_age:
                    endpoints_to_remove.append(path)

            # Remove old endpoints
            for path in endpoints_to_remove:
                del endpoints[path]

            # Remove clients with no endpoints
            if not endpoints:
                ips_to_remove.append(client_ip)

        # Remove old clients
        for ip in ips_to_remove:
            del self.buckets[ip]


# Global rate limiter instance
_rate_limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    """
    FastAPI middleware for rate limiting.

    Usage:
        app.middleware("http")(rate_limit_middleware)
    """
    # Skip rate limiting for health checks and root
    if request.url.path in ["/", "/api/health", "/docs", "/openapi.json", "/redoc"]:
        response = await call_next(request)
        return response

    # Get client IP and check rate limit
    client_ip = _rate_limiter.get_client_ip(request)
    allowed, headers = _rate_limiter.is_allowed(client_ip, request.url.path)

    # Process request if allowed
    if allowed:
        response = await call_next(request)
        # Add rate limit headers
        for key, value in headers.items():
            response.headers[key] = value
        return response

    # Return 429 Too Many Requests
    reset_time = headers.get("X-RateLimit-Reset", "unknown")
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Please retry after {reset_time}",
            "retry_after": headers.get("X-RateLimit-Reset"),
        },
        headers=headers,
    )


def get_rate_limiter() -> RateLimiter:
    """Get the global rate limiter instance."""
    return _rate_limiter
