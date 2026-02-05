"""Tests for workflow_adapter module."""
import pytest
import json
import os
import sys
from unittest.mock import patch, mock_open

# Add execution directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'execution'))

from workflow_adapter import (
    adapt_scraping_pipeline,
    adapt_newsletter_agent,
    load_workflow,
    save_workflow,
    GEMINI_MODEL,
    GEMINI_CRED_NAME,
    S3_CRED_NAME
)


class TestLoadWorkflow:
    """Tests for load_workflow function."""

    def test_loads_json_file(self):
        """Should parse JSON from file."""
        mock_data = '{"name": "Test", "nodes": []}'

        with patch('builtins.open', mock_open(read_data=mock_data)):
            result = load_workflow('test.json')

        assert result == {"name": "Test", "nodes": []}

    def test_raises_on_invalid_json(self):
        """Should raise on malformed JSON."""
        with patch('builtins.open', mock_open(read_data='not json')):
            with pytest.raises(json.JSONDecodeError):
                load_workflow('test.json')


class TestSaveWorkflow:
    """Tests for save_workflow function."""

    def test_saves_json_file(self, tmp_path):
        """Should save workflow as JSON."""
        workflow = {"name": "Test", "nodes": []}
        output_path = tmp_path / "output" / "test.json"

        save_workflow(workflow, str(output_path))

        assert output_path.exists()
        with open(output_path) as f:
            saved_data = json.load(f)
        assert saved_data == workflow

    def test_creates_parent_directory(self, tmp_path):
        """Should create parent directory if it doesn't exist."""
        workflow = {"name": "Test", "nodes": []}
        output_path = tmp_path / "new_dir" / "nested" / "test.json"

        save_workflow(workflow, str(output_path))

        assert output_path.parent.exists()
        assert output_path.exists()


class TestAdaptScrapingPipeline:
    """Tests for adapt_scraping_pipeline function."""

    def test_replaces_scrape_url_node(self):
        """Should replace scrape_url executeWorkflow with HTTP Request."""
        workflow = {
            "nodes": [
                {
                    "name": "scrape_url",
                    "type": "n8n-nodes-base.executeWorkflow",
                    "parameters": {}
                }
            ]
        }

        result = adapt_scraping_pipeline(workflow)

        node = result['nodes'][0]
        assert node['type'] == 'n8n-nodes-base.httpRequest'
        assert node['typeVersion'] == 4.2
        assert 'r.jina.ai' in node['parameters']['url']

    def test_updates_evaluate_content_reference(self):
        """Should update evaluate_content to use new data path."""
        workflow = {
            "nodes": [
                {
                    "name": "evaluate_content",
                    "parameters": {
                        "text": "Content: {{ $json.data.json.content }}"
                    }
                }
            ]
        }

        result = adapt_scraping_pipeline(workflow)

        node = result['nodes'][0]
        assert "$json.content" in node['parameters']['text']
        assert "$json.data.json.content" not in node['parameters']['text']

    def test_updates_s3_credentials(self):
        """Should update S3 node credentials."""
        workflow = {
            "nodes": [
                {
                    "name": "upload_file",
                    "type": "n8n-nodes-base.s3",
                    "credentials": {}
                }
            ]
        }

        result = adapt_scraping_pipeline(workflow)

        node = result['nodes'][0]
        assert node['credentials']['s3']['name'] == S3_CRED_NAME

    def test_preserves_unrelated_nodes(self):
        """Should not modify unrelated nodes."""
        workflow = {
            "nodes": [
                {
                    "name": "other_node",
                    "type": "n8n-nodes-base.set",
                    "parameters": {"value": "test"}
                }
            ]
        }

        result = adapt_scraping_pipeline(workflow)

        node = result['nodes'][0]
        assert node['type'] == 'n8n-nodes-base.set'
        assert node['parameters']['value'] == "test"


class TestAdaptNewsletterAgent:
    """Tests for adapt_newsletter_agent function."""

    def test_replaces_anthropic_with_gemini(self):
        """Should replace Claude LLM node with Gemini."""
        workflow = {
            "nodes": [
                {
                    "name": "LLM Node",
                    "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
                    "parameters": {}
                }
            ]
        }

        result = adapt_newsletter_agent(workflow)

        node = result['nodes'][0]
        assert node['type'] == '@n8n/n8n-nodes-langchain.lmChatGoogleGemini'
        assert 'gemini' in node['parameters']['modelName']

    def test_replaces_openai_with_gemini(self):
        """Should replace OpenAI LLM node with Gemini."""
        workflow = {
            "nodes": [
                {
                    "name": "LLM Node",
                    "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
                    "parameters": {}
                }
            ]
        }

        result = adapt_newsletter_agent(workflow)

        node = result['nodes'][0]
        assert node['type'] == '@n8n/n8n-nodes-langchain.lmChatGoogleGemini'
        assert node['parameters']['modelName'] == GEMINI_MODEL

    def test_updates_existing_gemini_nodes(self):
        """Should update existing Gemini nodes with correct model."""
        workflow = {
            "nodes": [
                {
                    "name": "Gemini Node",
                    "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
                    "parameters": {"modelName": "old-model"}
                }
            ]
        }

        result = adapt_newsletter_agent(workflow)

        node = result['nodes'][0]
        assert node['parameters']['modelName'] == GEMINI_MODEL
        assert node['credentials']['googlePalmApi']['name'] == GEMINI_CRED_NAME

    def test_updates_s3_credentials(self):
        """Should update S3 node credentials."""
        workflow = {
            "nodes": [
                {
                    "name": "s3_node",
                    "type": "n8n-nodes-base.s3",
                    "credentials": {}
                }
            ]
        }

        result = adapt_newsletter_agent(workflow)

        node = result['nodes'][0]
        assert node['credentials']['s3']['name'] == S3_CRED_NAME

    def test_preserves_non_llm_nodes(self):
        """Should not modify unrelated nodes."""
        workflow = {
            "nodes": [
                {
                    "name": "Other Node",
                    "type": "n8n-nodes-base.set",
                    "parameters": {"value": "test"}
                }
            ]
        }

        result = adapt_newsletter_agent(workflow)

        node = result['nodes'][0]
        assert node['type'] == "n8n-nodes-base.set"
        assert node['parameters']['value'] == "test"

    def test_handles_multiple_llm_nodes(self):
        """Should replace all LLM nodes in workflow."""
        workflow = {
            "nodes": [
                {
                    "name": "Claude 1",
                    "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
                    "parameters": {}
                },
                {
                    "name": "OpenAI 1",
                    "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
                    "parameters": {}
                },
                {
                    "name": "Set Node",
                    "type": "n8n-nodes-base.set",
                    "parameters": {}
                }
            ]
        }

        result = adapt_newsletter_agent(workflow)

        # Both LLM nodes should be converted to Gemini
        gemini_nodes = [n for n in result['nodes']
                       if n['type'] == '@n8n/n8n-nodes-langchain.lmChatGoogleGemini']
        assert len(gemini_nodes) == 2

        # Set node should be unchanged
        set_nodes = [n for n in result['nodes']
                    if n['type'] == 'n8n-nodes-base.set']
        assert len(set_nodes) == 1
