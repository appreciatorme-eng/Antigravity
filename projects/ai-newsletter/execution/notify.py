"""
Slack notification utilities for error alerting.
Sends notifications when scripts fail or need attention.

Usage:
    from notify import notify_error, notify_success

    try:
        do_something()
        notify_success("Task completed")
    except Exception as e:
        notify_error("Task failed", e)
"""
import logging
import os
from typing import Optional

import requests
from dotenv import load_dotenv

logger = logging.getLogger('notify')

# Load environment
load_dotenv()

# Slack webhook URL for notifications (optional)
SLACK_WEBHOOK_URL = os.getenv("SLACK_WEBHOOK_URL")
SLACK_CHANNEL = os.getenv("SLACK_NOTIFY_CHANNEL", "#alerts")

# Notification settings
NOTIFY_ON_SUCCESS = os.getenv("NOTIFY_ON_SUCCESS", "false").lower() == "true"
NOTIFY_ON_ERROR = os.getenv("NOTIFY_ON_ERROR", "true").lower() == "true"


def _send_slack_message(
    text: str,
    color: str = "#ff0000",
    title: Optional[str] = None,
    fields: Optional[list] = None
) -> bool:
    """
    Send a message to Slack via webhook.

    Args:
        text: Message text
        color: Attachment color (hex)
        title: Optional title
        fields: Optional list of field dicts

    Returns:
        True if sent successfully, False otherwise
    """
    if not SLACK_WEBHOOK_URL:
        logger.debug("SLACK_WEBHOOK_URL not configured, skipping notification")
        return False

    try:
        attachment = {
            "color": color,
            "text": text,
            "footer": "AI Newsletter Bot",
        }

        if title:
            attachment["title"] = title

        if fields:
            attachment["fields"] = fields

        payload = {
            "channel": SLACK_CHANNEL,
            "attachments": [attachment]
        }

        response = requests.post(
            SLACK_WEBHOOK_URL,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            logger.debug("Slack notification sent successfully")
            return True
        else:
            logger.warning(f"Slack notification failed: {response.status_code}")
            return False

    except Exception as e:
        logger.warning(f"Failed to send Slack notification: {e}")
        return False


def notify_error(
    message: str,
    exception: Optional[Exception] = None,
    script_name: Optional[str] = None
) -> bool:
    """
    Send an error notification to Slack.

    Args:
        message: Error message
        exception: Optional exception object
        script_name: Optional script name for context

    Returns:
        True if sent successfully
    """
    if not NOTIFY_ON_ERROR:
        return False

    fields = []

    if script_name:
        fields.append({
            "title": "Script",
            "value": script_name,
            "short": True
        })

    if exception:
        fields.append({
            "title": "Error Type",
            "value": type(exception).__name__,
            "short": True
        })
        fields.append({
            "title": "Details",
            "value": str(exception)[:500],  # Truncate long errors
            "short": False
        })

    return _send_slack_message(
        text=message,
        color="#ff0000",  # Red
        title="Error Alert",
        fields=fields if fields else None
    )


def notify_success(
    message: str,
    script_name: Optional[str] = None,
    details: Optional[str] = None
) -> bool:
    """
    Send a success notification to Slack.

    Args:
        message: Success message
        script_name: Optional script name for context
        details: Optional additional details

    Returns:
        True if sent successfully
    """
    if not NOTIFY_ON_SUCCESS:
        return False

    fields = []

    if script_name:
        fields.append({
            "title": "Script",
            "value": script_name,
            "short": True
        })

    if details:
        fields.append({
            "title": "Details",
            "value": details,
            "short": False
        })

    return _send_slack_message(
        text=message,
        color="#36a64f",  # Green
        title="Success",
        fields=fields if fields else None
    )


def notify_warning(
    message: str,
    script_name: Optional[str] = None
) -> bool:
    """
    Send a warning notification to Slack.

    Args:
        message: Warning message
        script_name: Optional script name for context

    Returns:
        True if sent successfully
    """
    fields = []

    if script_name:
        fields.append({
            "title": "Script",
            "value": script_name,
            "short": True
        })

    return _send_slack_message(
        text=message,
        color="#ffcc00",  # Yellow
        title="Warning",
        fields=fields if fields else None
    )


# Context manager for error notification
class ErrorNotifier:
    """
    Context manager that sends Slack notification on exception.

    Usage:
        with ErrorNotifier("import_workflows"):
            import_workflows()
    """

    def __init__(self, script_name: str):
        self.script_name = script_name

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            notify_error(
                f"Script failed: {self.script_name}",
                exception=exc_val,
                script_name=self.script_name
            )
        return False  # Don't suppress the exception
