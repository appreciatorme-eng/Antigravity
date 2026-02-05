"""Create a test workflow in n8n to verify API connectivity."""
import sys
from n8n_utils import N8NClient, logger

# Test workflow definition
TEST_WORKFLOW = {
    "name": "Antigravity Hello World",
    "nodes": [
        {
            "parameters": {},
            "id": "Manual Trigger",
            "name": "When clicking \"Execute Workflow\"",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [460, 460]
        },
        {
            "parameters": {
                "content": "## Hello from Antigravity!\n\nCreated via n8n API."
            },
            "id": "Sticky Note",
            "name": "Sticky Note",
            "type": "n8n-nodes-base.stickyNote",
            "typeVersion": 1,
            "position": [680, 460]
        }
    ],
    "connections": {},
    "settings": {}
}


def main():
    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    logger.info(f"Creating test workflow on {client.config.api_url}")

    workflow_id = client.import_workflow(TEST_WORKFLOW)

    if workflow_id:
        logger.info(f"Success! Workflow ID: {workflow_id}")
    else:
        logger.error("Failed to create test workflow")
        sys.exit(1)


if __name__ == "__main__":
    main()
