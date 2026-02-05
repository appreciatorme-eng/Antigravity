"""Tests for import_workflows.py."""
import pytest
import sys
import os
import json
from unittest.mock import patch, MagicMock, mock_open

# Add execution directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))


class TestImportWorkflows:
    """Tests for import_workflows.py main function."""

    @patch('import_workflows.N8NClient')
    def test_exits_when_client_creation_fails(self, mock_client_class):
        """Should exit when N8NClient creation fails."""
        from import_workflows import main

        mock_client_class.side_effect = ValueError("Invalid config")

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_exits_when_workflows_dir_missing(self, mock_client_class, mock_exists):
        """Should exit when workflows directory doesn't exist."""
        from import_workflows import main

        mock_client_class.return_value = MagicMock()
        mock_exists.return_value = False

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('import_workflows.os.listdir')
    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_handles_empty_workflows_directory(self, mock_client_class, mock_exists, mock_listdir):
        """Should handle empty workflows directory gracefully."""
        from import_workflows import main

        mock_client_class.return_value = MagicMock()
        mock_exists.return_value = True
        mock_listdir.return_value = []

        # Should not raise, just return
        main()

    @patch('import_workflows.os.listdir')
    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_filters_non_json_files(self, mock_client_class, mock_exists, mock_listdir):
        """Should only process .json files."""
        from import_workflows import main

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_exists.return_value = True
        mock_listdir.return_value = ['workflow.json', 'readme.md', 'notes.txt', 'other.json']

        workflow_data = {"name": "Test", "nodes": [], "connections": {}}

        with patch('builtins.open', mock_open(read_data=json.dumps(workflow_data))):
            mock_client.import_workflow.return_value = "wf-123"
            main()

        # Should only import .json files (2 calls)
        assert mock_client.import_workflow.call_count == 2

    @patch('import_workflows.os.listdir')
    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_removes_id_before_import(self, mock_client_class, mock_exists, mock_listdir):
        """Should remove 'id' field from workflow before import."""
        from import_workflows import main

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_exists.return_value = True
        mock_listdir.return_value = ['workflow.json']

        workflow_data = {"id": "old-id", "name": "Test", "nodes": [], "connections": {}}

        with patch('builtins.open', mock_open(read_data=json.dumps(workflow_data))):
            mock_client.import_workflow.return_value = "new-id"
            main()

        # Verify the workflow passed to import_workflow has no 'id' key
        call_args = mock_client.import_workflow.call_args[0][0]
        assert 'id' not in call_args

    @patch('import_workflows.os.listdir')
    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_successful_import(self, mock_client_class, mock_exists, mock_listdir):
        """Should successfully import workflows."""
        from import_workflows import main

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_exists.return_value = True
        mock_listdir.return_value = ['workflow1.json', 'workflow2.json']

        workflow_data = {"name": "Test", "nodes": [], "connections": {}}

        with patch('builtins.open', mock_open(read_data=json.dumps(workflow_data))):
            mock_client.import_workflow.return_value = "wf-123"
            main()

        assert mock_client.import_workflow.call_count == 2

    @patch('import_workflows.os.listdir')
    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_handles_import_failure(self, mock_client_class, mock_exists, mock_listdir):
        """Should handle import failure gracefully."""
        from import_workflows import main

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_exists.return_value = True
        mock_listdir.return_value = ['workflow.json']

        workflow_data = {"name": "Test", "nodes": [], "connections": {}}

        with patch('builtins.open', mock_open(read_data=json.dumps(workflow_data))):
            mock_client.import_workflow.return_value = None  # Failure
            # Should not raise, just log error
            main()

    @patch('import_workflows.os.listdir')
    @patch('import_workflows.os.path.exists')
    @patch('import_workflows.N8NClient')
    def test_handles_json_decode_error(self, mock_client_class, mock_exists, mock_listdir):
        """Should handle invalid JSON in workflow file."""
        from import_workflows import main

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_exists.return_value = True
        mock_listdir.return_value = ['invalid.json']

        with patch('builtins.open', mock_open(read_data='not valid json')):
            with pytest.raises(json.JSONDecodeError):
                main()
