"""Configure Slack credentials in n8n and update workflow."""
import os
import sys
import json
from typing import Optional
from n8n_utils import N8NClient, require_env_var, logger

# Workflow file path
INPUT_WORKFLOW = "workflows/adapted/newsletter_agent_adapted.json"
# Fallback to original if adapted doesn't exist
if not os.path.exists(INPUT_WORKFLOW):
    INPUT_WORKFLOW = "workflows/newsletter_agent.json"


def update_workflow_file(cred_id: str) -> Optional[dict]:
    """
    Update the local workflow file with the new Slack credential ID.

    Args:
        cred_id: The credential ID to use

    Returns:
        The updated workflow data, or None if no updates needed
    """
    logger.info(f"Updating workflow '{INPUT_WORKFLOW}' to use Credential ID: {cred_id}")

    with open(INPUT_WORKFLOW, 'r') as f:
        wf = json.load(f)

    updated = False
    for node in wf.get('nodes', []):
        # Look for Slack nodes
        if node.get('type') == 'n8n-nodes-base.slack':
            logger.info(f"  - Updating node '{node.get('name')}'")
            node['credentials'] = {
                "slackApi": {
                    "id": cred_id,
                    "name": "Slack API (Antigravity)"
                }
            }
            updated = True

    if updated:
        # Save the updated workflow locally
        with open(INPUT_WORKFLOW, 'w') as f:
            json.dump(wf, f, indent=2)
        logger.info("Workflow file updated locally.")
        return wf
    else:
        logger.warning("No Slack nodes found to update.")
        return None


def import_or_update_workflow(client: N8NClient, wf_data: dict):
    """
    Import or update the workflow in n8n.

    Args:
        client: N8NClient instance
        wf_data: Workflow data to import/update
    """
    workflow_name = wf_data.get('name')
    existing_id = client.find_workflow_by_name(workflow_name)

    if existing_id:
        logger.info(f"Found existing workflow '{workflow_name}' (ID: {existing_id}). Updating...")
        if client.update_workflow(existing_id, wf_data):
            logger.info("Successfully updated workflow in n8n.")
        else:
            logger.error("Failed to update workflow.")
    else:
        logger.info("Importing as new workflow...")
        new_id = client.import_workflow(wf_data)
        if new_id:
            logger.info(f"Successfully imported (ID: {new_id})")
        else:
            logger.error("Failed to import workflow.")


def main():
    token = require_env_var("SLACK_BOT_TOKEN")
    if not token:
        sys.exit(1)

    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    # Create Slack credential
    cred_id = client.create_credential(
        name="Slack API (Antigravity)",
        cred_type="slackApi",
        data={
            "accessToken": token,
            "notice": ""
        }
    )

    if not cred_id:
        logger.error("Failed to create Slack credential")
        sys.exit(1)

    logger.info(f"Slack credential configured successfully: {cred_id}")

    # Update workflow file and import to n8n
    wf_data = update_workflow_file(cred_id)
    if wf_data:
        import_or_update_workflow(client, wf_data)


if __name__ == "__main__":
    main()
