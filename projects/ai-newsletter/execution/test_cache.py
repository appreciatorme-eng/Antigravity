
"""Test the local caching utility."""
import time
import shutil
import os
from execution.cache_utils import local_cache, clear_cache, CACHE_DIR

# Ensure clean state
if os.path.exists(CACHE_DIR):
    shutil.rmtree(CACHE_DIR)

@local_cache(ttl_seconds=2)
def expensive_operation(x):
    """Simulate an expensive operation."""
    print(f"Computing expensive operation for {x}...")
    return x * x

def main():
    print("Running cache tests...")
    
    # First call - should compute
    print("\n1. First call (should compute):")
    start = time.time()
    result1 = expensive_operation(10)
    print(f"Result: {result1}")
    
    # Second call - should hit cache
    print("\n2. Second call (should hit cache):")
    start = time.time()
    result2 = expensive_operation(10)
    print(f"Result: {result2}")
    
    # Wait for TTL expiries
    print("\n3. Waiting for 3 seconds (TTL is 2s)...")
    time.sleep(3)
    
    # Third call - should re-compute
    print("\n4. Third call after TTL (should re-compute):")
    result3 = expensive_operation(10)
    print(f"Result: {result3}")

    print("\nTests completed.")

if __name__ == "__main__":
    main()
