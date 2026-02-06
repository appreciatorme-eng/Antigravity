"""
Centralized configuration for ai-newsletter execution scripts.
Consolidates magic strings and provides validation utilities.
"""
import os
from urllib.parse import urlparse

from dotenv import load_dotenv

load_dotenv()

# Credential names (can be overridden via environment)
CREDENTIAL_NAMES = {
    "gemini": os.getenv("GEMINI_CRED_NAME", "Google Gemini Attributes"),
    "s3": os.getenv("S3_CRED_NAME", "AWS S3"),
    "slack": os.getenv("SLACK_CRED_NAME", "Slack Bot"),
    "jina": os.getenv("JINA_CRED_NAME", "Jina AI"),
    "openai": os.getenv("OPENAI_CRED_NAME", "OpenAI"),
}

# Model configuration
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-1.5-flash")

# Workflow paths
WORKFLOW_INPUT_DIR = os.getenv("WORKFLOW_INPUT_DIR", "workflows")
WORKFLOW_OUTPUT_DIR = os.getenv("WORKFLOW_OUTPUT_DIR", "workflows/adapted")

# Timeouts
DEFAULT_TIMEOUT = int(os.getenv("DEFAULT_TIMEOUT", "30"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "10"))

# Retry configuration
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))
BACKOFF_FACTOR = int(os.getenv("BACKOFF_FACTOR", "2"))


def validate_url(url: str, require_https: bool = False) -> bool:
    """
    Validate that a URL is well-formed.

    Args:
        url: URL string to validate
        require_https: If True, only accept HTTPS URLs

    Returns:
        True if valid, False otherwise
    """
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return False
        if require_https and parsed.scheme != 'https':
            return False
        return True
    except Exception:
        return False


def get_credential_name(service: str) -> str:
    """
    Get the credential name for a service.

    Args:
        service: Service key (gemini, s3, slack, jina, openai)

    Returns:
        Credential name string
    """
    return CREDENTIAL_NAMES.get(service, service)
