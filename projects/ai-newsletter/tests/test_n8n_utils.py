"""Tests for n8n_utils shared module."""
import pytest
from unittest.mock import patch, MagicMock
from requests.exceptions import Timeout, HTTPError

import sys
import os

# Add execution directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))

from n8n_utils import (
    N8NConfig, N8NClient, require_env_var,
    retry_with_backoff, DEFAULT_TIMEOUT, validate_url
)


class TestValidateUrl:
    """Tests for validate_url function."""

    def test_valid_http_url(self):
        """Valid HTTP URL should return True."""
        assert validate_url("http://localhost:5678") is True

    def test_valid_https_url(self):
        """Valid HTTPS URL should return True."""
        assert validate_url("https://example.com") is True

    def test_invalid_url_no_scheme(self):
        """URL without scheme should return False."""
        assert validate_url("localhost:5678") is False

    def test_invalid_url_no_netloc(self):
        """URL without netloc should return False."""
        assert validate_url("http://") is False

    def test_empty_string(self):
        """Empty string should return False."""
        assert validate_url("") is False

    def test_require_https_with_http(self):
        """HTTP URL should fail when HTTPS is required."""
        assert validate_url("http://example.com", require_https=True) is False

    def test_require_https_with_https(self):
        """HTTPS URL should pass when HTTPS is required."""
        assert validate_url("https://example.com", require_https=True) is True


class TestN8NConfig:
    """Tests for N8NConfig class."""

    def test_config_loads_from_env(self, monkeypatch):
        """Config should load values from environment."""
        monkeypatch.setenv("N8N_API_URL", "http://test:5678")
        monkeypatch.setenv("N8N_API_KEY", "test-key")

        config = N8NConfig()

        assert config.api_url == "http://test:5678"
        assert config.api_key == "test-key"

    def test_config_strips_trailing_slash(self, monkeypatch):
        """Config should strip trailing slash from URL."""
        monkeypatch.setenv("N8N_API_URL", "http://test:5678/")
        monkeypatch.setenv("N8N_API_KEY", "test-key")

        config = N8NConfig()

        assert config.api_url == "http://test:5678"

    def test_config_uses_default_url(self, monkeypatch):
        """Config should use default URL if not specified."""
        monkeypatch.delenv("N8N_API_URL", raising=False)
        monkeypatch.setenv("N8N_API_KEY", "test-key")

        config = N8NConfig()

        assert config.api_url == "http://localhost:5678"

    @patch('n8n_utils.load_dotenv')
    def test_config_validate_fails_without_key(self, mock_dotenv, monkeypatch):
        """Validation should fail if API key is missing."""
        monkeypatch.setenv("N8N_API_URL", "http://test:5678")
        monkeypatch.delenv("N8N_API_KEY", raising=False)

        config = N8NConfig()

        assert config.validate() is False

    def test_config_validate_succeeds_with_all_vars(self, monkeypatch):
        """Validation should succeed with all required vars."""
        monkeypatch.setenv("N8N_API_URL", "http://test:5678")
        monkeypatch.setenv("N8N_API_KEY", "test-key")

        config = N8NConfig()

        assert config.validate() is True

    def test_config_validate_fails_with_invalid_url(self, monkeypatch):
        """Validation should fail if URL is malformed."""
        monkeypatch.setenv("N8N_API_URL", "not-a-valid-url")
        monkeypatch.setenv("N8N_API_KEY", "test-key")

        config = N8NConfig()

        assert config.validate() is False

    def test_headers_property(self, monkeypatch):
        """Headers property should return correct structure."""
        monkeypatch.setenv("N8N_API_URL", "http://test:5678")
        monkeypatch.setenv("N8N_API_KEY", "my-api-key")

        config = N8NConfig()

        assert config.headers == {
            "X-N8N-API-KEY": "my-api-key",
            "Content-Type": "application/json"
        }


class TestRetryWithBackoff:
    """Tests for retry decorator."""

    def test_no_retry_on_success(self):
        """Should not retry if function succeeds."""
        call_count = 0

        @retry_with_backoff(max_retries=3)
        def succeeds():
            nonlocal call_count
            call_count += 1
            return "success"

        result = succeeds()

        assert result == "success"
        assert call_count == 1

    def test_retries_on_timeout(self):
        """Should retry on Timeout exception."""
        call_count = 0

        @retry_with_backoff(max_retries=2, backoff_factor=0)
        def fails_then_succeeds():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise Timeout("Connection timed out")
            return "success"

        result = fails_then_succeeds()

        assert result == "success"
        assert call_count == 2

    def test_retries_on_connection_error(self):
        """Should retry on ConnectionError."""
        call_count = 0

        @retry_with_backoff(max_retries=2, backoff_factor=0)
        def fails_then_succeeds():
            nonlocal call_count
            call_count += 1
            if call_count < 2:
                raise ConnectionError("Connection refused")
            return "success"

        result = fails_then_succeeds()

        assert result == "success"
        assert call_count == 2

    def test_raises_after_max_retries(self):
        """Should raise after exhausting retries."""
        @retry_with_backoff(max_retries=2, backoff_factor=0)
        def always_fails():
            raise Timeout("Connection timed out")

        with pytest.raises(Timeout):
            always_fails()

    def test_no_retry_on_http_error(self):
        """Should not retry HTTPError (client/server errors)."""
        call_count = 0

        @retry_with_backoff(max_retries=3, backoff_factor=0)
        def http_error():
            nonlocal call_count
            call_count += 1
            raise HTTPError("Bad request")

        with pytest.raises(HTTPError):
            http_error()

        assert call_count == 1  # No retries


class TestN8NClient:
    """Tests for N8NClient class."""

    @pytest.fixture
    def mock_config(self, monkeypatch):
        """Setup valid config for tests."""
        monkeypatch.setenv("N8N_API_URL", "http://test:5678")
        monkeypatch.setenv("N8N_API_KEY", "test-key")

    @patch('n8n_utils.load_dotenv')
    def test_client_raises_on_invalid_config(self, mock_dotenv, monkeypatch):
        """Client should raise ValueError with invalid config."""
        monkeypatch.delenv("N8N_API_URL", raising=False)
        monkeypatch.delenv("N8N_API_KEY", raising=False)

        with pytest.raises(ValueError, match="Invalid n8n configuration"):
            N8NClient()

    @patch('n8n_utils.requests.post')
    def test_create_credential_success(self, mock_post, mock_config):
        """Should create credential and return ID."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "cred-123", "name": "Test Cred"}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        client = N8NClient()
        result = client.create_credential(
            name="Test Cred",
            cred_type="openAiApi",
            data={"apiKey": "test"}
        )

        assert result == "cred-123"
        mock_post.assert_called_once()
        call_kwargs = mock_post.call_args[1]
        assert call_kwargs['timeout'] == DEFAULT_TIMEOUT

    @patch('n8n_utils.requests.post')
    def test_create_credential_http_error(self, mock_post, mock_config):
        """Should return None on HTTP error."""
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        error = HTTPError(response=mock_response)
        error.response = mock_response
        mock_response.raise_for_status.side_effect = error
        mock_post.return_value = mock_response

        client = N8NClient()
        result = client.create_credential(
            name="Test Cred",
            cred_type="openAiApi",
            data={"apiKey": "test"}
        )

        assert result is None

    @patch('n8n_utils.requests.get')
    def test_get_workflows(self, mock_get, mock_config):
        """Should fetch and return workflows."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"id": "wf-1", "name": "Workflow 1"},
                {"id": "wf-2", "name": "Workflow 2"}
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        client = N8NClient()
        result = client.get_workflows()

        assert len(result) == 2
        assert result[0]["id"] == "wf-1"

    @patch('n8n_utils.requests.get')
    def test_find_workflow_by_name(self, mock_get, mock_config):
        """Should find workflow ID by name."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"id": "wf-1", "name": "Other Workflow"},
                {"id": "wf-2", "name": "My Workflow"}
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        client = N8NClient()
        result = client.find_workflow_by_name("My Workflow")

        assert result == "wf-2"

    @patch('n8n_utils.requests.get')
    def test_find_workflow_by_name_not_found(self, mock_get, mock_config):
        """Should return None if workflow not found."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "data": [
                {"id": "wf-1", "name": "Other Workflow"}
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        client = N8NClient()
        result = client.find_workflow_by_name("Missing Workflow")

        assert result is None

    @patch('n8n_utils.requests.post')
    def test_import_workflow(self, mock_post, mock_config):
        """Should import workflow and return ID."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"id": "wf-new", "name": "Imported"}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        client = N8NClient()
        result = client.import_workflow({
            "name": "Test Workflow",
            "nodes": [],
            "connections": {},
            "extra_field": "should be filtered"
        })

        assert result == "wf-new"
        # Verify extra_field was filtered out
        call_json = mock_post.call_args[1]['json']
        assert "extra_field" not in call_json


class TestRequireEnvVar:
    """Tests for require_env_var helper."""

    def test_returns_value_when_present(self, monkeypatch):
        """Should return value when env var exists."""
        monkeypatch.setenv("TEST_VAR", "test-value")

        result = require_env_var("TEST_VAR")

        assert result == "test-value"

    def test_returns_none_when_missing(self, monkeypatch):
        """Should return None when env var is missing."""
        monkeypatch.delenv("MISSING_VAR", raising=False)

        result = require_env_var("MISSING_VAR")

        assert result is None

    def test_returns_none_for_empty_string(self, monkeypatch):
        """Should return None for empty string value."""
        monkeypatch.setenv("EMPTY_VAR", "")

        result = require_env_var("EMPTY_VAR")

        assert result is None
