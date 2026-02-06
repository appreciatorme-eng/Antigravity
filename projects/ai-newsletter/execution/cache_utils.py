"""
Simple local caching utility for development.
Reduces API calls and speeds up iteration by storing results locally.
"""
import os
import json
import hashlib
import functools
import time
from typing import Any, Callable, Optional
try:
    from execution.n8n_utils import logger
except ImportError:
    from n8n_utils import logger

CACHE_DIR = ".cache"

def get_cache_key(func_name: str, args: tuple, kwargs: dict) -> str:
    """Generate a stable cache key based on function name and arguments."""
    key_data = {
        "func": func_name,
        "args": args,
        "kwargs": kwargs
    }
    # Sort keys for stability
    serialized = json.dumps(key_data, sort_keys=True, default=str)
    return hashlib.md5(serialized.encode('utf-8')).hexdigest()

def local_cache(ttl_seconds: Optional[int] = None):
    """
    Decorator to cache function results in a local JSON file.
    
    Args:
        ttl_seconds: Optional time-to-live in seconds. If None, cache never expires.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Ensure cache directory exists
            os.makedirs(CACHE_DIR, exist_ok=True)
            
            key = get_cache_key(func.__name__, args, kwargs)
            cache_file = os.path.join(CACHE_DIR, f"{key}.json")
            
            # Check cache hit
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'r') as f:
                        cached_data = json.load(f)
                    
                    # Check expiration if TTL provided
                    if ttl_seconds:
                        age = time.time() - cached_data['timestamp']
                        if age > ttl_seconds:
                            logger.info(f"Cache expired for {func.__name__}")
                            os.remove(cache_file)
                        else:
                            logger.debug(f"Cache hit for {func.__name__}")
                            return cached_data['result']
                    else:
                        logger.debug(f"Cache hit for {func.__name__}")
                        return cached_data['result']
                        
                except (json.JSONDecodeError, OSError) as e:
                    logger.warning(f"Failed to read cache: {e}")
            
            # Cache miss - execute function
            result = func(*args, **kwargs)
            
            # Save to cache
            try:
                with open(cache_file, 'w') as f:
                    json.dump({
                        "timestamp": time.time(),
                        "result": result
                    }, f)
            except (TypeError, OSError) as e:
                logger.warning(f"Failed to write cache (result might not be serializable): {e}")
                
            return result
        return wrapper
    return decorator

def clear_cache():
    """Clear all cached files."""
    if os.path.exists(CACHE_DIR):
        for f in os.listdir(CACHE_DIR):
            if f.endswith(".json"):
                os.remove(os.path.join(CACHE_DIR, f))
        logger.info("Cache cleared.")
