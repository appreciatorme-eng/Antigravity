"""Tests for rate limiting utilities."""
import time
import pytest

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))

from rate_limit import RateLimiter, rate_limit, get_limiter


class TestRateLimiter:
    """Tests for RateLimiter class."""

    def test_no_wait_under_limit(self):
        """Should not wait when under the limit."""
        limiter = RateLimiter(calls_per_minute=60, calls_per_second=10)
        start = time.time()
        limiter.wait()
        elapsed = time.time() - start
        assert elapsed < 0.1  # Should be nearly instant

    def test_wait_when_per_second_exceeded(self):
        """Should wait when per-second limit exceeded."""
        limiter = RateLimiter(calls_per_minute=60, calls_per_second=2)

        # Make 2 calls quickly (at limit)
        limiter.wait()
        limiter.wait()

        # Third call should wait
        start = time.time()
        limiter.wait()
        elapsed = time.time() - start

        # Should have waited close to 1 second
        assert elapsed >= 0.5  # At least half a second

    def test_reset_clears_windows(self):
        """Reset should clear the tracking windows."""
        limiter = RateLimiter(calls_per_minute=2, calls_per_second=1)

        # Fill up the limiter
        limiter.wait()
        limiter.wait()

        # Reset
        limiter.reset()

        # Should not wait now
        start = time.time()
        limiter.wait()
        elapsed = time.time() - start
        assert elapsed < 0.1


class TestRateLimitDecorator:
    """Tests for rate_limit decorator."""

    def test_decorator_applies_rate_limit(self):
        """Decorated function should respect rate limit."""
        call_count = 0

        @rate_limit(calls_per_minute=60, calls_per_second=2)
        def tracked_func():
            nonlocal call_count
            call_count += 1
            return call_count

        # First two calls should be fast
        start = time.time()
        tracked_func()
        tracked_func()
        elapsed = time.time() - start
        assert elapsed < 0.5

        assert call_count == 2

    def test_decorator_exposes_limiter(self):
        """Decorated function should expose limiter for testing."""
        @rate_limit(calls_per_minute=60)
        def my_func():
            pass

        assert hasattr(my_func, 'limiter')
        assert isinstance(my_func.limiter, RateLimiter)

    def test_shared_limiter_by_name(self):
        """Functions with same limiter_name should share limiter."""
        @rate_limit(limiter_name='shared', calls_per_minute=60)
        def func_a():
            pass

        @rate_limit(limiter_name='shared', calls_per_minute=60)
        def func_b():
            pass

        assert func_a.limiter is func_b.limiter


class TestGetLimiter:
    """Tests for get_limiter function."""

    def test_creates_new_limiter(self):
        """Should create a new limiter for new name."""
        limiter = get_limiter('test_new', calls_per_minute=100)
        assert isinstance(limiter, RateLimiter)
        assert limiter.calls_per_minute == 100

    def test_returns_existing_limiter(self):
        """Should return same limiter for same name."""
        limiter1 = get_limiter('test_existing', calls_per_minute=50)
        limiter2 = get_limiter('test_existing', calls_per_minute=100)  # Different config ignored
        assert limiter1 is limiter2
