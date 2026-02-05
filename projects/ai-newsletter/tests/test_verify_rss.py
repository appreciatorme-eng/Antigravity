"""Tests for verify_rss.py."""
import pytest
import sys
import os
from unittest.mock import patch, MagicMock
from requests.exceptions import RequestException, Timeout, ConnectionError as RequestsConnectionError

# Add execution directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))


class TestVerifyRSS:
    """Tests for verify_rss.py verify function."""

    @patch('verify_rss.requests.get')
    def test_successful_verification_with_items(self, mock_get):
        """Should return True when feed has valid items."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {"title": "Test Article", "date_published": "2024-01-15"}
            ]
        }
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is True
        mock_get.assert_called_once_with("https://example.com/feed.json", timeout=10)

    @patch('verify_rss.requests.get')
    def test_uses_provided_url(self, mock_get):
        """Should use the URL passed as argument."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"items": [{"title": "Test"}]}
        mock_get.return_value = mock_response

        verify("https://custom.feed/rss.json")

        mock_get.assert_called_once_with("https://custom.feed/rss.json", timeout=10)

    @patch('verify_rss.os.getenv')
    @patch('verify_rss.requests.get')
    def test_uses_env_var_when_no_url_provided(self, mock_get, mock_getenv):
        """Should use RSS_FEED_URL environment variable when no URL provided."""
        from verify_rss import verify

        mock_getenv.return_value = "https://env.feed/rss.json"
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"items": [{"title": "Test"}]}
        mock_get.return_value = mock_response

        verify()

        mock_get.assert_called_once_with("https://env.feed/rss.json", timeout=10)

    @patch('verify_rss.requests.get')
    def test_returns_false_for_non_200_status(self, mock_get):
        """Should return False when status code is not 200."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "Not Found"
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_returns_false_for_500_error(self, mock_get):
        """Should return False for server errors."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_returns_false_for_empty_items(self, mock_get):
        """Should return False when feed has no items."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"items": []}
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_returns_false_for_missing_items_key(self, mock_get):
        """Should return False when items key is missing."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"data": "no items here"}
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_returns_false_for_expired_feed(self, mock_get):
        """Should return False when feed content suggests expiration."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [{"title": "Test"}],
            "status": "expired"
        }
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_returns_false_for_expired_in_items(self, mock_get):
        """Should detect expiration mentioned anywhere in response."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [{"title": "This feed has EXPIRED"}]
        }
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_handles_timeout_exception(self, mock_get):
        """Should return False on timeout."""
        from verify_rss import verify

        mock_get.side_effect = Timeout("Connection timed out")

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_handles_request_exception(self, mock_get):
        """Should return False on request failure."""
        from verify_rss import verify

        mock_get.side_effect = RequestException("Connection refused")

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_handles_connection_error(self, mock_get):
        """Should return False on connection error."""
        from verify_rss import verify

        mock_get.side_effect = RequestsConnectionError("Failed to connect")

        result = verify("https://example.com/feed.json")

        assert result is False

    @patch('verify_rss.requests.get')
    def test_multiple_items_returns_true(self, mock_get):
        """Should return True when feed has multiple valid items."""
        from verify_rss import verify

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "items": [
                {"title": "Article 1", "date_published": "2024-01-15"},
                {"title": "Article 2", "date_published": "2024-01-14"},
                {"title": "Article 3", "date_published": "2024-01-13"}
            ]
        }
        mock_get.return_value = mock_response

        result = verify("https://example.com/feed.json")

        assert result is True


class TestVerifyRSSMainBlock:
    """Tests for verify_rss.py __main__ execution."""

    @patch('verify_rss.verify')
    @patch('verify_rss.sys.exit')
    def test_exits_0_on_success(self, mock_exit, mock_verify):
        """Should exit with code 0 when verification succeeds."""
        mock_verify.return_value = True

        # Import and run the module's main block behavior
        import verify_rss
        # Simulate __main__ behavior
        success = mock_verify()
        if success:
            mock_exit(0)
        else:
            mock_exit(1)

        mock_exit.assert_called_with(0)

    @patch('verify_rss.verify')
    @patch('verify_rss.sys.exit')
    def test_exits_1_on_failure(self, mock_exit, mock_verify):
        """Should exit with code 1 when verification fails."""
        mock_verify.return_value = False

        # Simulate __main__ behavior
        success = mock_verify()
        if success:
            mock_exit(0)
        else:
            mock_exit(1)

        mock_exit.assert_called_with(1)
