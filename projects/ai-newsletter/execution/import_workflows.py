"""Import adapted workflows to n8n."""
import os
import sys
import json
from n8n_utils import N8NClient, logger

WORKFLOWS_DIR = "workflows/adapted"


def main():
    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    if not os.path.exists(WORKFLOWS_DIR):
        logger.error(f"Workflows directory not found: {WORKFLOWS_DIR}")
        sys.exit(1)

    files = [f for f in os.listdir(WORKFLOWS_DIR) if f.endswith('.json')]

    if not files:
        logger.warning(f"No workflow files found in {WORKFLOWS_DIR}")
        return

    logger.info(f"Found {len(files)} workflow(s) to import")

    for filename in files:
        filepath = os.path.join(WORKFLOWS_DIR, filename)
        with open(filepath, 'r') as f:
            workflow_data = json.load(f)

        # Remove ID to create new workflow
        workflow_data.pop('id', None)

        workflow_id = client.import_workflow(workflow_data)
        if workflow_id:
            logger.info(f"Imported {filename} (ID: {workflow_id})")
        else:
            logger.error(f"Failed to import {filename}")


if __name__ == "__main__":
    main()
