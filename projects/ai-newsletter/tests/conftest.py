"""
Pytest configuration and shared fixtures for ai-newsletter tests.
"""
import os
import pytest
from dotenv import load_dotenv


def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests (require real credentials)"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )


@pytest.fixture(scope="session", autouse=True)
def load_env():
    """Load environment variables for all tests."""
    load_dotenv()


@pytest.fixture
def n8n_credentials():
    """
    Fixture that provides n8n credentials or skips if not available.

    Usage:
        @pytest.mark.integration
        def test_real_n8n(n8n_credentials):
            api_url, api_key = n8n_credentials
            # test with real credentials
    """
    load_dotenv()
    api_url = os.getenv("N8N_API_URL")
    api_key = os.getenv("N8N_API_KEY")

    if not api_url or not api_key:
        pytest.skip("N8N credentials not configured")

    return api_url, api_key


@pytest.fixture
def aws_credentials():
    """
    Fixture that provides AWS credentials or skips if not available.

    Usage:
        @pytest.mark.integration
        def test_real_s3(aws_credentials):
            access_key, secret_key, bucket = aws_credentials
            # test with real credentials
    """
    load_dotenv()
    access_key = os.getenv("AWS_ACCESS_KEY_ID")
    secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    bucket = os.getenv("AWS_BUCKET_NAME")

    if not access_key or not secret_key or not bucket:
        pytest.skip("AWS credentials not configured")

    return access_key, secret_key, bucket


@pytest.fixture
def gemini_api_key():
    """
    Fixture that provides Gemini API key or skips if not available.

    Usage:
        @pytest.mark.integration
        def test_real_gemini(gemini_api_key):
            # test with real API key
    """
    load_dotenv()
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY")

    if not api_key:
        pytest.skip("Gemini API key not configured")

    return api_key


@pytest.fixture
def slack_token():
    """
    Fixture that provides Slack bot token or skips if not available.

    Usage:
        @pytest.mark.integration
        def test_real_slack(slack_token):
            # test with real token
    """
    load_dotenv()
    token = os.getenv("SLACK_BOT_TOKEN")

    if not token:
        pytest.skip("Slack token not configured")

    return token


@pytest.fixture
def jina_api_key():
    """
    Fixture that provides Jina API key or skips if not available.

    Usage:
        @pytest.mark.integration
        def test_real_jina(jina_api_key):
            # test with real API key
    """
    load_dotenv()
    api_key = os.getenv("JINA_API_KEY")

    if not api_key:
        pytest.skip("Jina API key not configured")

    return api_key
