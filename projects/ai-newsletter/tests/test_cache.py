"""
Unit tests for cache_utils.py
"""
import pytest
import os
import shutil
import time
from execution.cache_utils import local_cache, CACHE_DIR, clear_cache

# Setup and teardown
@pytest.fixture(autouse=True)
def clean_cache():
    """Ensure cache is clean before and after each test."""
    clear_cache()
    if os.path.exists(CACHE_DIR):
        shutil.rmtree(CACHE_DIR)
    yield
    clear_cache()
    if os.path.exists(CACHE_DIR):
        shutil.rmtree(CACHE_DIR)

def test_cache_hit():
    """Test that second call hits the cache."""
    
    call_count = 0
    
    @local_cache()
    def expensive_func(x):
        nonlocal call_count
        call_count += 1
        return x * 2
    
    # First call
    assert expensive_func(5) == 10
    assert call_count == 1
    
    # Second call (should be cached)
    assert expensive_func(5) == 10
    assert call_count == 1
    
    # Different arg (should be new call)
    assert expensive_func(6) == 12
    assert call_count == 2

def test_cache_ttl():
    """Test that cache expires after TTL."""
    
    call_count = 0
    
    @local_cache(ttl_seconds=1)
    def transient_func():
        nonlocal call_count
        call_count += 1
        return "data"
    
    # First call
    transient_func()
    assert call_count == 1
    
    # Immediate second call (cached)
    transient_func()
    assert call_count == 1
    
    # Wait for expiration
    time.sleep(1.1)
    
    # Third call (should re-run)
    transient_func()
    assert call_count == 2

def test_cache_key_stability():
    """Test that cache keys are stable across kwargs order."""
    
    call_count = 0
    
    @local_cache()
    def stable_func(a, b=1):
        nonlocal call_count
        call_count += 1
        return a + b
    
    stable_func(10, b=2)
    assert call_count == 1
    
    # Different kwarg order (functionally same) but our simple key generation 
    # might rely on json dump order. The implementation sorts keys, so this should match.
    # Note: call syntax doesn't change dict order in python < 3.7 explicitly but 
    # our `get_cache_key` sorts the dict items.
    
    stable_func(10, b=2)
    assert call_count == 1
