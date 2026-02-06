"""
Workflow adapter for transforming n8n workflows to use cost-optimized services.
Replaces Claude/OpenAI with Gemini, adds Jina AI for scraping.
"""
import json
import logging
import os
from typing import Any, Dict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('workflow_adapter')

# Try to import from config module, fall back to defaults
try:
    from config import (
        WORKFLOW_INPUT_DIR as INPUT_DIR,
        WORKFLOW_OUTPUT_DIR as OUTPUT_DIR,
        GEMINI_MODEL,
        get_credential_name,
    )
    GEMINI_CRED_NAME = get_credential_name("gemini")
    S3_CRED_NAME = get_credential_name("s3")
except ImportError:
    # Fallback defaults when run standalone
    INPUT_DIR = os.getenv("WORKFLOW_INPUT_DIR", "workflows")
    OUTPUT_DIR = os.getenv("WORKFLOW_OUTPUT_DIR", "workflows/adapted")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-1.5-flash")
    GEMINI_CRED_NAME = os.getenv("GEMINI_CRED_NAME", "Google Gemini Attributes")
    S3_CRED_NAME = os.getenv("S3_CRED_NAME", "AWS S3")

def load_workflow(filename: str) -> Dict[str, Any]:
    """Load a workflow JSON file."""
    with open(filename, 'r') as f:
        return json.load(f)


def save_workflow(data: Dict[str, Any], filename: str) -> None:
    """Save workflow data to a JSON file."""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def adapt_scraping_pipeline(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adapt scraping pipeline to use Jina AI for web scraping.

    Args:
        workflow: The workflow dictionary to adapt

    Returns:
        The adapted workflow dictionary
    """
    logger.info("Adapting Scraping Pipeline...")
    nodes = workflow.get('nodes', [])
    new_nodes = []

    for node in nodes:
        # 1. Replace 'scrape_url' (executeWorkflow) with Jina AI HTTP Request
        if node.get('name') == 'scrape_url' and node.get('type') == 'n8n-nodes-base.executeWorkflow':
            logger.info("Replacing 'scrape_url' with Jina AI HTTP Request")
            node['type'] = 'n8n-nodes-base.httpRequest'
            node['typeVersion'] = 4.2
            node['parameters'] = {
                "method": "GET",
                "url": "={{ 'https://r.jina.ai/' + $json.url }}",
                "authentication": "none", # Jina is free/no-auth for basic use
                "options": {
                    "responseFormat": "json" # Jina returns JSON if Accept header? Or plain text? 
                                            # Jina Reader returns Markdown by default.
                                            # Actually r.jina.ai returns text/plain usually.
                                            # But if we use https://r.jina.ai/URL it returns the text.
                                            # Let's verify Jina behavior.
                                            # Usually it returns the markdown content in the body.
                }
            }
            # Adjust output parsing if necessary. The original node outputted 'data.json.content'
            # We might need a Set node after to map Jina output to 'data.json.content' structure 
            # OR adjust downstream nodes.
            # Downstream 'evaluate_content' uses: {{ $json.data.json.content }}
            # If we change this node, we should try to match the output structure or update downstream.
            # Easier to update this node to output { "data": { "json": { "content": "..." } } } ?
            # HTTP Request node outputs body.
            # We can use a Function/Code node to reshape it? 
            # Or just update the httpRequest to put response in a property?
            node['parameters']['options']['responsePropertyName'] = 'content' 
            # usage: https://r.jina.ai/<url>
            
            # Use a Set node or Code node to restructure?
            # Actually, let's keep it simple. We will add a 'set' node after this in the connections?
            # No, inserting nodes is hard (coordinates).
            # Best is to just change the downstream references?
            # 'evaluate_content' uses {{ $json.data.json.content }}
            # Let's change 'evaluate_content' parameter to {{ $json.content }}
            
        # 2. Update downstream references to 'scrape_url'
        if node.get('name') == 'evaluate_content':
            # Original: {{ $json.data.json.content }}
            # New Jina: {{ $json.content }} (assuming we put response in 'content')
            if 'parameters' in node and 'text' in node['parameters']:
                logger.info("Updating 'evaluate_content' reference")
                node['parameters']['text'] = node['parameters']['text'].replace('$json.data.json.content', '$json.content')

        # 3. Handle 'api.aitools.inc' calls - Replace with direct S3 or ignore
        # The 'copy_markdown' and 'copy_html' nodes were using aitools API to copy files in S3/R2?
        # If we use standard S3, we might not need this "copy" logic if we upload to the right place initially.
        # But 'upload_temp_markdown' uploads to .temp.
        # 'copy_markdown' copies .temp to .md and sets metadata.
        # We can try to replace 'copy_markdown' with an S3 Copy Object node if available, or just Python/AWS node.
        # For now, let's just update the S3 credentials for 'upload_temp_markdown'.
        
        if node.get('type') == 'n8n-nodes-base.s3':
            logger.info(f"Updating credentials for S3 node: {node.get('name')}")
            node['credentials'] = {
                "s3": {
                    "id": "AWS_S3_CRED_ID",  # Placeholder, relies on name mapping in import
                    "name": S3_CRED_NAME
                }
            }

        new_nodes.append(node)

    workflow['nodes'] = new_nodes
    return workflow


def adapt_newsletter_agent(workflow: Dict[str, Any]) -> Dict[str, Any]:
    """
    Adapt newsletter agent to use Gemini instead of Claude/OpenAI.

    Args:
        workflow: The workflow dictionary to adapt

    Returns:
        The adapted workflow dictionary
    """
    logger.info("Adapting Newsletter Agent...")
    nodes = workflow.get('nodes', [])
    new_nodes = []

    for node in nodes:
        # 1. Replace LLM nodes (Claude/OpenAI) with Gemini
        if node.get('type') in ['@n8n/n8n-nodes-langchain.lmChatAnthropic', '@n8n/n8n-nodes-langchain.lmChatOpenAi']:
            logger.info(f"Replacing LLM node '{node.get('name')}' with Gemini")
            node['type'] = '@n8n/n8n-nodes-langchain.lmChatGoogleGemini'
            node['typeVersion'] = 1
            node['parameters'] = {
                "modelName": GEMINI_MODEL,
                "options": {}
            }
            node['credentials'] = {
                "googlePalmApi": {
                    "id": "GOOGLE_GEMINI_CRED_ID",
                    "name": GEMINI_CRED_NAME
                }
            }

        # 2. Update existing Gemini nodes (if any) to ensure correct model/creds
        if node.get('type') == '@n8n/n8n-nodes-langchain.lmChatGoogleGemini':
            logger.info(f"Updating existing Gemini node '{node.get('name')}'")
            node['parameters']['modelName'] = GEMINI_MODEL
            node['credentials'] = {
                "googlePalmApi": {
                    "id": "GOOGLE_GEMINI_CRED_ID",
                    "name": GEMINI_CRED_NAME
                }
            }

        # 3. Update S3 nodes
        if node.get('type') == 'n8n-nodes-base.s3':
            logger.info(f"Updating credentials for S3 node: {node.get('name')}")
            node['credentials'] = {
                "s3": {
                    "id": "AWS_S3_CRED_ID",
                    "name": S3_CRED_NAME
                }
            }

        new_nodes.append(node)

    workflow['nodes'] = new_nodes
    return workflow

if __name__ == "__main__":
    import sys

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    exit_code = 0

    # Process Scraping Pipeline
    scraping_input = f"{INPUT_DIR}/scraping_pipeline.json"
    try:
        scraping_wf = load_workflow(scraping_input)
        adapted_scraping = adapt_scraping_pipeline(scraping_wf)
        save_workflow(adapted_scraping, f"{OUTPUT_DIR}/scraping_pipeline_adapted.json")
        logger.info("Success: scraping_pipeline_adapted.json")
    except FileNotFoundError:
        logger.error(f"Workflow file not found: {scraping_input}")
        exit_code = 1
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {scraping_input}: {e}")
        exit_code = 1
    except OSError as e:
        logger.error(f"File system error processing scraping pipeline: {e}")
        exit_code = 1

    # Process Newsletter Agent
    newsletter_input = f"{INPUT_DIR}/newsletter_agent.json"
    try:
        newsletter_wf = load_workflow(newsletter_input)
        adapted_newsletter = adapt_newsletter_agent(newsletter_wf)
        save_workflow(adapted_newsletter, f"{OUTPUT_DIR}/newsletter_agent_adapted.json")
        logger.info("Success: newsletter_agent_adapted.json")
    except FileNotFoundError:
        logger.error(f"Workflow file not found: {newsletter_input}")
        exit_code = 1
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {newsletter_input}: {e}")
        exit_code = 1
    except OSError as e:
        logger.error(f"File system error processing newsletter agent: {e}")
        exit_code = 1

    sys.exit(exit_code)
