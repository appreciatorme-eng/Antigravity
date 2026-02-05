"""Tests for configure_*.py scripts."""
import pytest
import sys
import os
from unittest.mock import patch, MagicMock

# Add execution directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))


class TestConfigureOpenAI:
    """Tests for configure_openai.py."""

    @patch('configure_openai.N8NClient')
    @patch('configure_openai.require_env_var')
    def test_successful_credential_creation(self, mock_require_env, mock_client_class):
        """Should create OpenAI credential successfully."""
        from configure_openai import main

        mock_require_env.return_value = "test-api-key"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = "cred-123"

        # Should not raise
        main()

        mock_client.create_credential.assert_called_once_with(
            name="OpenAI API (Antigravity)",
            cred_type="openAiApi",
            data={
                "apiKey": "test-api-key",
                "url": "https://api.openai.com/v1",
                "header": False
            }
        )

    @patch('configure_openai.require_env_var')
    def test_exits_when_api_key_missing(self, mock_require_env):
        """Should exit when OPENAI_API_KEY is missing."""
        from configure_openai import main

        mock_require_env.return_value = None

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('configure_openai.N8NClient')
    @patch('configure_openai.require_env_var')
    def test_exits_when_client_creation_fails(self, mock_require_env, mock_client_class):
        """Should exit when N8NClient creation fails."""
        from configure_openai import main

        mock_require_env.return_value = "test-api-key"
        mock_client_class.side_effect = ValueError("Invalid config")

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('configure_openai.N8NClient')
    @patch('configure_openai.require_env_var')
    def test_exits_when_credential_creation_fails(self, mock_require_env, mock_client_class):
        """Should exit when credential creation fails."""
        from configure_openai import main

        mock_require_env.return_value = "test-api-key"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = None

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1


class TestConfigureGemini:
    """Tests for configure_gemini.py."""

    @patch('configure_gemini.N8NClient')
    @patch('configure_gemini.require_env_var')
    def test_successful_credential_creation(self, mock_require_env, mock_client_class):
        """Should create Gemini credential successfully."""
        from configure_gemini import main

        mock_require_env.return_value = "test-gemini-key"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = "cred-456"

        main()

        mock_client.create_credential.assert_called_once_with(
            name="Google Gemini Attributes",
            cred_type="googlePalmApi",
            data={
                "apiKey": "test-gemini-key",
                "host": "generativelanguage.googleapis.com"
            }
        )

    @patch('configure_gemini.require_env_var')
    def test_exits_when_api_key_missing(self, mock_require_env):
        """Should exit when GOOGLE_GEMINI_API_KEY is missing."""
        from configure_gemini import main

        mock_require_env.return_value = None

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1


class TestConfigureJina:
    """Tests for configure_jina.py."""

    @patch('configure_jina.N8NClient')
    @patch('configure_jina.require_env_var')
    def test_successful_credential_creation(self, mock_require_env, mock_client_class):
        """Should create Jina credential with Bearer token."""
        from configure_jina import main

        mock_require_env.return_value = "test-jina-key"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = "cred-789"

        main()

        mock_client.create_credential.assert_called_once_with(
            name="Jina AI API",
            cred_type="httpHeaderAuth",
            data={
                "name": "Authorization",
                "value": "Bearer test-jina-key"
            }
        )

    @patch('configure_jina.require_env_var')
    def test_exits_when_api_key_missing(self, mock_require_env):
        """Should exit when JINA_API_KEY is missing."""
        from configure_jina import main

        mock_require_env.return_value = None

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1


class TestConfigureAWS:
    """Tests for configure_aws.py."""

    @patch('configure_aws.N8NClient')
    @patch('configure_aws.require_env_var')
    @patch('configure_aws.os.getenv')
    @patch('configure_aws.load_dotenv')
    def test_successful_credential_creation(self, mock_dotenv, mock_getenv, mock_require_env, mock_client_class):
        """Should create AWS credential successfully."""
        from configure_aws import main

        # Mock require_env_var for access_key and secret_key
        mock_require_env.side_effect = ["test-access-key", "test-secret-key"]
        # Mock os.getenv for region and bucket
        mock_getenv.side_effect = ["us-west-2", "my-bucket"]

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = "cred-aws"

        main()

        mock_client.create_credential.assert_called_once_with(
            name="AWS S3",
            cred_type="aws",
            data={
                "accessKeyId": "test-access-key",
                "secretAccessKey": "test-secret-key",
                "region": "us-west-2"
            }
        )

    @patch('configure_aws.require_env_var')
    @patch('configure_aws.load_dotenv')
    def test_exits_when_access_key_missing(self, mock_dotenv, mock_require_env):
        """Should exit when AWS_ACCESS_KEY_ID is missing."""
        from configure_aws import main

        mock_require_env.side_effect = [None, "test-secret"]

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('configure_aws.require_env_var')
    @patch('configure_aws.load_dotenv')
    def test_exits_when_secret_key_missing(self, mock_dotenv, mock_require_env):
        """Should exit when AWS_SECRET_ACCESS_KEY is missing."""
        from configure_aws import main

        mock_require_env.side_effect = ["test-access", None]

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('configure_aws.N8NClient')
    @patch('configure_aws.require_env_var')
    @patch('configure_aws.os.getenv')
    @patch('configure_aws.load_dotenv')
    def test_uses_default_region(self, mock_dotenv, mock_getenv, mock_require_env, mock_client_class):
        """Should use default region when AWS_REGION not set."""
        from configure_aws import main

        mock_require_env.side_effect = ["test-access", "test-secret"]
        # Return None for region (triggers default), then bucket
        mock_getenv.side_effect = [None, None]

        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = "cred-aws"

        # Need to reload module to reset getenv mock
        import configure_aws
        import importlib
        importlib.reload(configure_aws)

        # The default region is "us-east-1" when AWS_REGION is not set


class TestConfigureSlack:
    """Tests for configure_slack.py."""

    @patch('configure_slack.import_or_update_workflow')
    @patch('configure_slack.update_workflow_file')
    @patch('configure_slack.N8NClient')
    @patch('configure_slack.require_env_var')
    def test_successful_credential_creation(self, mock_require_env, mock_client_class,
                                           mock_update_file, mock_import_workflow):
        """Should create Slack credential and update workflow."""
        from configure_slack import main

        mock_require_env.return_value = "xoxb-test-token"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = "cred-slack"
        mock_update_file.return_value = {"name": "Test Workflow", "nodes": []}

        main()

        mock_client.create_credential.assert_called_once_with(
            name="Slack API (Antigravity)",
            cred_type="slackApi",
            data={
                "accessToken": "xoxb-test-token",
                "notice": ""
            }
        )
        mock_update_file.assert_called_once_with("cred-slack")
        mock_import_workflow.assert_called_once()

    @patch('configure_slack.require_env_var')
    def test_exits_when_token_missing(self, mock_require_env):
        """Should exit when SLACK_BOT_TOKEN is missing."""
        from configure_slack import main

        mock_require_env.return_value = None

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1

    @patch('configure_slack.N8NClient')
    @patch('configure_slack.require_env_var')
    def test_exits_when_credential_creation_fails(self, mock_require_env, mock_client_class):
        """Should exit when Slack credential creation fails."""
        from configure_slack import main

        mock_require_env.return_value = "xoxb-test-token"
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        mock_client.create_credential.return_value = None

        with pytest.raises(SystemExit) as exc_info:
            main()

        assert exc_info.value.code == 1


class TestConfigureSlackWorkflowUpdate:
    """Tests for configure_slack.py workflow update functions."""

    @patch('builtins.open', create=True)
    @patch('configure_slack.json.load')
    @patch('configure_slack.json.dump')
    def test_update_workflow_file_updates_slack_nodes(self, mock_dump, mock_load, mock_open):
        """Should update Slack nodes with credential ID."""
        from configure_slack import update_workflow_file

        mock_load.return_value = {
            "name": "Test Workflow",
            "nodes": [
                {"name": "Slack Node", "type": "n8n-nodes-base.slack", "credentials": {}},
                {"name": "Other Node", "type": "n8n-nodes-base.set", "parameters": {}}
            ]
        }

        result = update_workflow_file("cred-123")

        assert result is not None
        # Verify Slack node was updated
        slack_node = result['nodes'][0]
        assert slack_node['credentials']['slackApi']['id'] == "cred-123"
        assert slack_node['credentials']['slackApi']['name'] == "Slack API (Antigravity)"

    @patch('builtins.open', create=True)
    @patch('configure_slack.json.load')
    def test_update_workflow_file_returns_none_when_no_slack_nodes(self, mock_load, mock_open):
        """Should return None when no Slack nodes found."""
        from configure_slack import update_workflow_file

        mock_load.return_value = {
            "name": "Test Workflow",
            "nodes": [
                {"name": "Other Node", "type": "n8n-nodes-base.set", "parameters": {}}
            ]
        }

        result = update_workflow_file("cred-123")

        assert result is None
