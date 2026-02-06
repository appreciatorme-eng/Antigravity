"""
Rate limiting utilities to prevent API throttling.
Provides decorators and helpers for rate-limited API calls.

Usage:
    from rate_limit import rate_limit, RateLimiter

    @rate_limit(calls_per_minute=60)
    def call_api():
        ...

    # Or use the limiter directly
    limiter = RateLimiter(calls_per_minute=60)
    limiter.wait()
    call_api()
"""
import logging
import threading
import time
from collections import deque
from functools import wraps
from typing import Callable, Optional

logger = logging.getLogger('rate_limit')


class RateLimiter:
    """
    Thread-safe rate limiter using sliding window algorithm.

    Args:
        calls_per_minute: Maximum calls allowed per minute
        calls_per_second: Maximum calls allowed per second (optional)
    """

    def __init__(
        self,
        calls_per_minute: int = 60,
        calls_per_second: Optional[int] = None
    ):
        self.calls_per_minute = calls_per_minute
        self.calls_per_second = calls_per_second or (calls_per_minute // 60 + 1)
        self.minute_window: deque = deque()
        self.second_window: deque = deque()
        self.lock = threading.Lock()

    def _clean_window(self, window: deque, max_age: float) -> None:
        """Remove timestamps older than max_age seconds."""
        now = time.time()
        while window and (now - window[0]) > max_age:
            window.popleft()

    def wait(self) -> float:
        """
        Wait if necessary to respect rate limits.

        Returns:
            Time waited in seconds
        """
        with self.lock:
            now = time.time()
            wait_time = 0.0

            # Check per-second limit
            self._clean_window(self.second_window, 1.0)
            if len(self.second_window) >= self.calls_per_second:
                wait_time = max(wait_time, 1.0 - (now - self.second_window[0]))

            # Check per-minute limit
            self._clean_window(self.minute_window, 60.0)
            if len(self.minute_window) >= self.calls_per_minute:
                wait_time = max(wait_time, 60.0 - (now - self.minute_window[0]))

            if wait_time > 0:
                logger.debug(f"Rate limit: waiting {wait_time:.2f}s")
                time.sleep(wait_time)

            # Record this call
            now = time.time()
            self.second_window.append(now)
            self.minute_window.append(now)

            return wait_time

    def reset(self) -> None:
        """Reset the rate limiter windows."""
        with self.lock:
            self.second_window.clear()
            self.minute_window.clear()


# Global rate limiters for different services
_limiters: dict = {}
_limiter_lock = threading.Lock()


def get_limiter(
    name: str,
    calls_per_minute: int = 60,
    calls_per_second: Optional[int] = None
) -> RateLimiter:
    """
    Get or create a named rate limiter.

    Args:
        name: Limiter name (e.g., 'jina', 'gemini')
        calls_per_minute: Max calls per minute
        calls_per_second: Max calls per second

    Returns:
        RateLimiter instance
    """
    with _limiter_lock:
        if name not in _limiters:
            _limiters[name] = RateLimiter(
                calls_per_minute=calls_per_minute,
                calls_per_second=calls_per_second
            )
        return _limiters[name]


def rate_limit(
    calls_per_minute: int = 60,
    calls_per_second: Optional[int] = None,
    limiter_name: Optional[str] = None
) -> Callable:
    """
    Decorator to rate limit function calls.

    Args:
        calls_per_minute: Maximum calls per minute
        calls_per_second: Maximum calls per second
        limiter_name: Optional name for shared limiter

    Usage:
        @rate_limit(calls_per_minute=60)
        def call_jina_api():
            ...

        # Shared limiter across functions
        @rate_limit(limiter_name='gemini', calls_per_minute=60)
        def call_gemini():
            ...
    """
    def decorator(func: Callable) -> Callable:
        # Use named limiter or create function-specific one
        name = limiter_name or f"{func.__module__}.{func.__name__}"
        limiter = get_limiter(name, calls_per_minute, calls_per_second)

        @wraps(func)
        def wrapper(*args, **kwargs):
            limiter.wait()
            return func(*args, **kwargs)

        # Expose limiter for testing/reset
        wrapper.limiter = limiter
        return wrapper

    return decorator


# Pre-configured limiters for common services
# Jina AI: ~60 requests/minute on free tier
JINA_LIMITER = get_limiter('jina', calls_per_minute=50, calls_per_second=2)

# Gemini: ~60 requests/minute on free tier
GEMINI_LIMITER = get_limiter('gemini', calls_per_minute=50, calls_per_second=2)

# n8n: Usually self-hosted, but be gentle
N8N_LIMITER = get_limiter('n8n', calls_per_minute=120, calls_per_second=5)
