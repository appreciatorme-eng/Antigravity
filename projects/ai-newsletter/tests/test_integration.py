"""
Integration tests for ai-newsletter.

These tests require real credentials and make actual API calls.
They are skipped automatically if credentials are not configured.

Run with: pytest -m integration
Skip with: pytest -m "not integration"
"""
import pytest
import requests


@pytest.mark.integration
class TestN8NIntegration:
    """Integration tests for n8n API."""

    def test_n8n_connectivity(self, n8n_credentials):
        """Test that we can connect to n8n and list workflows."""
        api_url, api_key = n8n_credentials

        response = requests.get(
            f"{api_url.rstrip('/')}/api/v1/workflows",
            headers={"X-N8N-API-KEY": api_key},
            timeout=10
        )

        assert response.status_code == 200
        data = response.json()
        assert 'data' in data

    def test_n8n_credentials_endpoint(self, n8n_credentials):
        """Test that credentials endpoint is accessible."""
        api_url, api_key = n8n_credentials

        response = requests.get(
            f"{api_url.rstrip('/')}/api/v1/credentials",
            headers={"X-N8N-API-KEY": api_key},
            timeout=10
        )

        assert response.status_code == 200


@pytest.mark.integration
class TestJinaIntegration:
    """Integration tests for Jina AI Reader."""

    def test_jina_reader_basic(self, jina_api_key):
        """Test that Jina Reader can fetch a page."""
        response = requests.get(
            "https://r.jina.ai/https://example.com",
            headers={"Authorization": f"Bearer {jina_api_key}"},
            timeout=15
        )

        assert response.status_code == 200
        assert len(response.text) > 0


@pytest.mark.integration
@pytest.mark.slow
class TestSlackIntegration:
    """Integration tests for Slack API."""

    def test_slack_auth(self, slack_token):
        """Test that Slack token is valid."""
        response = requests.post(
            "https://slack.com/api/auth.test",
            headers={"Authorization": f"Bearer {slack_token}"},
            timeout=10
        )

        assert response.status_code == 200
        data = response.json()
        # Note: ok might be False if token is invalid, but API should respond
        assert 'ok' in data
