"""Verify data ingestion workflow executions."""
import os
import sys
try:
    from execution.n8n_utils import N8NClient, logger
except ImportError:
    from n8n_utils import N8NClient, logger

# Workflow ID - can be overridden via environment variable
DEFAULT_WORKFLOW_ID = "9qGuJh8HAnxXA8zH"


def main():
    workflow_id = os.getenv("INGESTION_WORKFLOW_ID", DEFAULT_WORKFLOW_ID)

    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    logger.info(f"Checking executions for workflow: {workflow_id}")

    try:
        executions = client.get_executions(workflow_id, limit=3)

        if not executions:
            logger.warning("No recent executions found")
            return

        for exe in executions:
            status = "Finished" if exe.get('finished') else "Running"
            logger.info(f"Execution {exe['id']}: {status} (mode: {exe['mode']})")

            if status == "Finished":
                details = client.get_execution_details(exe['id'])
                if details:
                    result_data = details.get('data', {}).get('resultData', {})
                    error = result_data.get('error')
                    if error:
                        logger.error(f"  Error: {error.get('message')}")
                    else:
                        logger.info("  Success")

    except Exception as e:
        logger.error(f"Failed to check executions: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
