"""Tests for verify_data.py."""
import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add execution directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))


class TestVerifyData:
    """Tests for verify_data.py main function."""

    @patch('verify_data.N8NClient')
    def test_exits_when_client_creation_fails(self, mock_client_class):
        """Should exit when N8NClient creation fails."""
        from verify_data import main

        mock_client_class.side_effect = ValueError("Invalid config")

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_uses_default_workflow_id(self, mock_client_class, mock_getenv):
        """Should use default workflow ID when env var not set."""
        from verify_data import main, DEFAULT_WORKFLOW_ID

        mock_getenv.return_value = DEFAULT_WORKFLOW_ID
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = []

        main()

        mock_client.get_executions.assert_called_once_with(DEFAULT_WORKFLOW_ID, limit=3)

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_uses_custom_workflow_id_from_env(self, mock_client_class, mock_getenv):
        """Should use workflow ID from environment variable."""
        from verify_data import main

        mock_getenv.return_value = "custom-workflow-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = []

        main()

        mock_client.get_executions.assert_called_once_with("custom-workflow-id", limit=3)

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_handles_no_executions(self, mock_client_class, mock_getenv):
        """Should handle case with no recent executions."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = []

        # Should not raise
        main()

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_reports_running_execution(self, mock_client_class, mock_getenv):
        """Should report running executions."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = [
            {"id": "exe-1", "finished": False, "mode": "manual"}
        ]

        main()

        # get_execution_details should not be called for running executions
        mock_client.get_execution_details.assert_not_called()

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_reports_successful_execution(self, mock_client_class, mock_getenv):
        """Should report successful finished executions."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = [
            {"id": "exe-1", "finished": True, "mode": "trigger"}
        ]
        mock_client.get_execution_details.return_value = {
            "data": {
                "resultData": {}  # No error = success
            }
        }

        main()

        mock_client.get_execution_details.assert_called_once_with("exe-1")

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_reports_failed_execution(self, mock_client_class, mock_getenv):
        """Should report failed executions with error message."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = [
            {"id": "exe-1", "finished": True, "mode": "trigger"}
        ]
        mock_client.get_execution_details.return_value = {
            "data": {
                "resultData": {
                    "error": {"message": "Connection timeout"}
                }
            }
        }

        main()

        mock_client.get_execution_details.assert_called_once_with("exe-1")

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_handles_multiple_executions(self, mock_client_class, mock_getenv):
        """Should process multiple executions."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = [
            {"id": "exe-1", "finished": True, "mode": "trigger"},
            {"id": "exe-2", "finished": False, "mode": "manual"},
            {"id": "exe-3", "finished": True, "mode": "trigger"}
        ]
        mock_client.get_execution_details.return_value = {
            "data": {"resultData": {}}
        }

        main()

        # Should call get_execution_details for finished executions only
        assert mock_client.get_execution_details.call_count == 2

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_handles_missing_execution_details(self, mock_client_class, mock_getenv):
        """Should handle when execution details are None."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.return_value = [
            {"id": "exe-1", "finished": True, "mode": "trigger"}
        ]
        mock_client.get_execution_details.return_value = None

        # Should not raise
        main()

    @patch('verify_data.os.getenv')
    @patch('verify_data.N8NClient')
    def test_exits_on_api_error(self, mock_client_class, mock_getenv):
        """Should exit when API call fails."""
        from verify_data import main

        mock_getenv.return_value = "test-id"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.get_executions.side_effect = Exception("API error")

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1
