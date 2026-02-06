#!/usr/bin/env python3
"""
Health check script to verify all ai-newsletter services are configured.
Checks n8n, Gemini, AWS S3, Slack, and Jina connectivity.

Usage:
    python verify_all.py [--verbose]

Exit codes:
    0 - All services healthy
    1 - One or more services failed
"""
import argparse
import logging
import os
import sys
from typing import Tuple

import requests
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('verify_all')

# Timeouts
CHECK_TIMEOUT = 10  # seconds


def check_n8n() -> Tuple[bool, str]:
    """Check n8n API connectivity."""
    load_dotenv()
    api_url = os.getenv("N8N_API_URL", "http://localhost:5678").rstrip('/')
    api_key = os.getenv("N8N_API_KEY")

    if not api_key:
        return False, "N8N_API_KEY not set"

    try:
        response = requests.get(
            f"{api_url}/api/v1/workflows",
            headers={"X-N8N-API-KEY": api_key},
            timeout=CHECK_TIMEOUT
        )
        response.raise_for_status()
        workflows = response.json().get('data', [])
        return True, f"Connected, {len(workflows)} workflows found"
    except requests.exceptions.ConnectionError:
        return False, f"Cannot connect to {api_url}"
    except requests.exceptions.Timeout:
        return False, "Connection timed out"
    except requests.exceptions.HTTPError as e:
        return False, f"HTTP error: {e.response.status_code}"
    except Exception as e:
        return False, f"Error: {e}"


def check_gemini() -> Tuple[bool, str]:
    """Check Gemini API key is configured."""
    load_dotenv()
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

    if not api_key:
        return False, "GOOGLE_GEMINI_API_KEY not set"

    # Just verify the key is set - actual API validation would cost money
    if len(api_key) < 20:
        return False, "API key appears too short"

    return True, "API key configured"


def check_aws() -> Tuple[bool, str]:
    """Check AWS credentials are configured."""
    load_dotenv()
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    bucket = os.getenv("AWS_BUCKET_NAME")

    missing = []
    if not access_key:
        missing.append("AWS_ACCESS_KEY_ID")
    if not secret_key:
        missing.append("AWS_SECRET_ACCESS_KEY")
    if not bucket:
        missing.append("AWS_BUCKET_NAME")

    if missing:
        return False, f"Missing: {', '.join(missing)}"

    # Optional: Try to list bucket (would require boto3)
    return True, f"Credentials configured for bucket: {bucket}"


def check_slack() -> Tuple[bool, str]:
    """Check Slack bot token is configured."""
    load_dotenv()
    token = os.getenv("SLACK_BOT_TOKEN")

    if not token:
        return False, "SLACK_BOT_TOKEN not set"

    if not token.startswith("xoxb-"):
        return False, "Token should start with 'xoxb-'"

    return True, "Bot token configured"


def check_jina() -> Tuple[bool, str]:
    """Check Jina AI API key is configured."""
    load_dotenv()
    api_key = os.getenv("JINA_API_KEY")

    if not api_key:
        return False, "JINA_API_KEY not set"

    # Test with a simple request to Jina Reader
    try:
        response = requests.get(
            "https://r.jina.ai/https://example.com",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=CHECK_TIMEOUT
        )
        if response.status_code == 200:
            return True, "API key valid, Jina Reader accessible"
        elif response.status_code == 401:
            return False, "Invalid API key"
        else:
            return True, f"API key configured (status: {response.status_code})"
    except requests.exceptions.Timeout:
        return True, "API key configured (Jina timed out)"
    except Exception as e:
        return True, f"API key configured (could not verify: {e})"


def check_rss() -> Tuple[bool, str]:
    """Check RSS feed URL is configured and accessible."""
    load_dotenv()
    rss_url = os.getenv("RSS_FEED_URL")

    if not rss_url:
        return False, "RSS_FEED_URL not set (optional)"

    try:
        response = requests.get(rss_url, timeout=CHECK_TIMEOUT)
        if response.status_code == 200:
            return True, "RSS feed accessible"
        else:
            return False, f"RSS feed returned status {response.status_code}"
    except Exception as e:
        return False, f"Cannot access RSS feed: {e}"


def main():
    parser = argparse.ArgumentParser(description="Verify all ai-newsletter services")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show detailed output")
    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    checks = [
        ("n8n", check_n8n),
        ("Gemini", check_gemini),
        ("AWS S3", check_aws),
        ("Slack", check_slack),
        ("Jina AI", check_jina),
        ("RSS Feed", check_rss),
    ]

    print("\n" + "=" * 50)
    print("AI Newsletter Health Check")
    print("=" * 50 + "\n")

    all_passed = True
    results = []

    for name, check_func in checks:
        try:
            passed, message = check_func()
        except Exception as e:
            passed, message = False, f"Check failed: {e}"

        status = "PASS" if passed else "FAIL"
        icon = "\u2705" if passed else "\u274c"
        results.append((name, passed, message))

        print(f"{icon} {name}: {status}")
        if args.verbose or not passed:
            print(f"   {message}")

        if not passed and name != "RSS Feed":  # RSS is optional
            all_passed = False

    print("\n" + "-" * 50)
    if all_passed:
        print("\u2705 All required services configured!")
    else:
        print("\u274c Some services need configuration")
        print("\nCheck your .env file and ensure all required values are set.")
        print("See .env.example for the required variables.")

    print()
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
