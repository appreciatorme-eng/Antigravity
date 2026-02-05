"""Verify RSS feed connectivity and content."""
import os
import sys
import logging
from typing import Optional
import requests
from requests.exceptions import RequestException, Timeout

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('verify_rss')

# Default RSS feed URL - can be overridden via environment
DEFAULT_RSS_URL = "https://rss.app/feeds/v1.1/rXJrh1u8zDwJLUJK.json"
REQUEST_TIMEOUT = 10


def verify(url: Optional[str] = None) -> bool:
    """
    Verify RSS feed is accessible and contains items.

    Args:
        url: RSS feed URL to verify. If None, uses RSS_FEED_URL env var or default.

    Returns:
        True if feed is valid and has items, False otherwise.
    """
    feed_url = url or os.getenv("RSS_FEED_URL", DEFAULT_RSS_URL)

    logger.info(f"Fetching {feed_url}")

    try:
        response = requests.get(feed_url, timeout=REQUEST_TIMEOUT)
        logger.info(f"Status: {response.status_code}")

        if response.status_code != 200:
            logger.error(f"Failed to fetch: {response.text}")
            return False

        data = response.json()
        items = data.get('items', [])
        logger.info(f"Items found: {len(items)}")

        if items:
            logger.info(f"First item: {items[0].get('title')}")
            logger.info(f"Published: {items[0].get('date_published')}")

        if not items:
            logger.warning("No items - feed might be empty or expired")
            return False
        elif "expired" in str(data).lower():
            logger.warning("Feed content suggests expiration")
            return False
        else:
            logger.info("Feed appears valid and active")
            return True

    except Timeout:
        logger.error(f"Request timed out after {REQUEST_TIMEOUT}s")
        return False
    except RequestException as e:
        logger.error(f"Request failed: {e}")
        return False


if __name__ == "__main__":
    success = verify()
    sys.exit(0 if success else 1)
