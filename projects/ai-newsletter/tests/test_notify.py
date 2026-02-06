"""Tests for notification utilities."""
import pytest
from unittest.mock import patch, MagicMock

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))

from notify import (
    notify_error,
    notify_success,
    notify_warning,
    ErrorNotifier,
    _send_slack_message
)


class TestSlackMessage:
    """Tests for _send_slack_message function."""

    def test_returns_false_without_webhook(self, monkeypatch):
        """Should return False when webhook URL not configured."""
        monkeypatch.setattr('notify.SLACK_WEBHOOK_URL', None)
        result = _send_slack_message("Test message")
        assert result is False

    @patch('notify.requests.post')
    def test_sends_message_with_webhook(self, mock_post, monkeypatch):
        """Should send message when webhook configured."""
        monkeypatch.setattr('notify.SLACK_WEBHOOK_URL', 'https://hooks.slack.com/test')
        mock_post.return_value = MagicMock(status_code=200)

        result = _send_slack_message("Test message", color="#ff0000", title="Test")

        assert result is True
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert 'json' in call_args.kwargs
        payload = call_args.kwargs['json']
        assert 'attachments' in payload

    @patch('notify.requests.post')
    def test_returns_false_on_error(self, mock_post, monkeypatch):
        """Should return False when Slack returns error."""
        monkeypatch.setattr('notify.SLACK_WEBHOOK_URL', 'https://hooks.slack.com/test')
        mock_post.return_value = MagicMock(status_code=500)

        result = _send_slack_message("Test message")

        assert result is False


class TestNotifyError:
    """Tests for notify_error function."""

    def test_returns_false_when_disabled(self, monkeypatch):
        """Should return False when error notifications disabled."""
        monkeypatch.setattr('notify.NOTIFY_ON_ERROR', False)
        result = notify_error("Test error")
        assert result is False

    @patch('notify._send_slack_message')
    def test_sends_error_with_exception(self, mock_send, monkeypatch):
        """Should include exception details in notification."""
        monkeypatch.setattr('notify.NOTIFY_ON_ERROR', True)
        mock_send.return_value = True

        try:
            raise ValueError("Test exception")
        except ValueError as e:
            result = notify_error("Something failed", exception=e, script_name="test.py")

        assert result is True
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args.kwargs['color'] == "#ff0000"
        assert call_args.kwargs['title'] == "Error Alert"


class TestNotifySuccess:
    """Tests for notify_success function."""

    def test_returns_false_when_disabled(self, monkeypatch):
        """Should return False when success notifications disabled."""
        monkeypatch.setattr('notify.NOTIFY_ON_SUCCESS', False)
        result = notify_success("Test success")
        assert result is False

    @patch('notify._send_slack_message')
    def test_sends_success_message(self, mock_send, monkeypatch):
        """Should send success notification when enabled."""
        monkeypatch.setattr('notify.NOTIFY_ON_SUCCESS', True)
        mock_send.return_value = True

        result = notify_success("Task completed", script_name="test.py")

        assert result is True
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args.kwargs['color'] == "#36a64f"


class TestNotifyWarning:
    """Tests for notify_warning function."""

    @patch('notify._send_slack_message')
    def test_sends_warning_message(self, mock_send, monkeypatch):
        """Should send warning notification."""
        monkeypatch.setattr('notify.SLACK_WEBHOOK_URL', 'https://hooks.slack.com/test')
        mock_send.return_value = True

        result = notify_warning("Something might be wrong", script_name="test.py")

        assert result is True
        mock_send.assert_called_once()
        call_args = mock_send.call_args
        assert call_args.kwargs['color'] == "#ffcc00"


class TestErrorNotifier:
    """Tests for ErrorNotifier context manager."""

    @patch('notify.notify_error')
    def test_does_not_notify_on_success(self, mock_notify):
        """Should not send notification when no exception."""
        with ErrorNotifier("test_script"):
            pass  # No exception

        mock_notify.assert_not_called()

    @patch('notify.notify_error')
    def test_notifies_on_exception(self, mock_notify):
        """Should send notification when exception occurs."""
        mock_notify.return_value = True

        with pytest.raises(ValueError):
            with ErrorNotifier("test_script"):
                raise ValueError("Test error")

        mock_notify.assert_called_once()
        call_args = mock_notify.call_args
        assert "test_script" in call_args.kwargs.get('script_name', '')
