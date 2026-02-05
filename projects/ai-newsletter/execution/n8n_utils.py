"""
Shared utilities for n8n API interactions.
Consolidates common patterns from configure_*.py scripts.
"""
import os
import json
import logging
import time
from typing import Optional, Dict, Any, Callable
from functools import wraps

import requests
from requests.exceptions import RequestException, Timeout, HTTPError
from dotenv import load_dotenv

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('n8n_utils')

# Constants
DEFAULT_TIMEOUT = 30  # seconds
MAX_RETRIES = 3
BACKOFF_FACTOR = 2


class N8NConfig:
    """Configuration container for n8n API access."""

    def __init__(self):
        load_dotenv()
        self.api_url = os.getenv("N8N_API_URL", "http://localhost:5678").rstrip('/')
        self.api_key = os.getenv("N8N_API_KEY")

    def validate(self) -> bool:
        """Validate required configuration is present."""
        if not self.api_url or not self.api_key:
            logger.error("N8N_API_URL or N8N_API_KEY missing from environment")
            return False
        return True

    @property
    def headers(self) -> Dict[str, str]:
        """Standard headers for n8n API requests."""
        return {
            "X-N8N-API-KEY": self.api_key,
            "Content-Type": "application/json"
        }


def retry_with_backoff(max_retries: int = MAX_RETRIES, backoff_factor: int = BACKOFF_FACTOR):
    """
    Decorator for retry logic with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts
        backoff_factor: Multiplier for exponential backoff
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except (Timeout, ConnectionError) as e:
                    last_exception = e
                    if attempt < max_retries:
                        wait_time = backoff_factor ** attempt
                        logger.warning(
                            f"Attempt {attempt + 1} failed: {e}. "
                            f"Retrying in {wait_time}s..."
                        )
                        time.sleep(wait_time)
                    else:
                        logger.error(f"All {max_retries + 1} attempts failed")
                except HTTPError:
                    # Don't retry HTTP errors (4xx, 5xx) - they're usually not transient
                    raise
            raise last_exception
        return wrapper
    return decorator


class N8NClient:
    """Client for n8n API operations with proper error handling."""

    def __init__(self, config: Optional[N8NConfig] = None):
        self.config = config or N8NConfig()
        if not self.config.validate():
            raise ValueError("Invalid n8n configuration")

    @retry_with_backoff()
    def create_credential(
        self,
        name: str,
        cred_type: str,
        data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Create a credential in n8n.

        Args:
            name: Credential display name
            cred_type: n8n credential type (e.g., 'openAiApi', 'slackApi')
            data: Credential-specific data

        Returns:
            Credential ID if successful, None otherwise
        """
        url = f"{self.config.api_url}/api/v1/credentials"
        payload = {
            "name": name,
            "type": cred_type,
            "data": data
        }

        try:
            response = requests.post(
                url,
                headers=self.config.headers,
                json=payload,
                timeout=DEFAULT_TIMEOUT
            )
            response.raise_for_status()
            cred = response.json()
            logger.info(f"Created credential '{cred['name']}' (ID: {cred['id']})")
            return cred['id']

        except HTTPError as e:
            logger.error(f"HTTP error creating credential: {e}")
            if e.response is not None:
                logger.error(f"Response: {e.response.text}")
                if e.response.status_code == 400:
                    self._log_credential_schema(cred_type)
            return None
        except RequestException as e:
            logger.error(f"Request failed: {e}")
            return None

    def _log_credential_schema(self, cred_type: str) -> None:
        """Fetch and log credential schema for debugging."""
        try:
            url = f"{self.config.api_url}/api/v1/credentials/schema/{cred_type}"
            response = requests.get(
                url,
                headers=self.config.headers,
                timeout=DEFAULT_TIMEOUT
            )
            response.raise_for_status()
            logger.debug(f"Schema for {cred_type}: {json.dumps(response.json(), indent=2)}")
        except RequestException as e:
            logger.debug(f"Could not fetch schema: {e}")

    @retry_with_backoff()
    def get_workflows(self) -> list:
        """Fetch all workflows from n8n."""
        url = f"{self.config.api_url}/api/v1/workflows"
        response = requests.get(
            url,
            headers=self.config.headers,
            timeout=DEFAULT_TIMEOUT
        )
        response.raise_for_status()
        return response.json().get('data', [])

    def find_workflow_by_name(self, name: str) -> Optional[str]:
        """Find workflow ID by name."""
        try:
            workflows = self.get_workflows()
            for wf in workflows:
                if wf.get('name') == name:
                    return wf['id']
        except RequestException as e:
            logger.error(f"Failed to search workflows: {e}")
        return None

    @retry_with_backoff()
    def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific workflow by ID."""
        url = f"{self.config.api_url}/api/v1/workflows/{workflow_id}"
        try:
            response = requests.get(
                url,
                headers=self.config.headers,
                timeout=DEFAULT_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Failed to fetch workflow {workflow_id}: {e}")
            return None

    @retry_with_backoff()
    def update_workflow(self, workflow_id: str, workflow_data: Dict[str, Any]) -> bool:
        """Update an existing workflow."""
        url = f"{self.config.api_url}/api/v1/workflows/{workflow_id}"
        try:
            response = requests.put(
                url,
                headers=self.config.headers,
                json=workflow_data,
                timeout=DEFAULT_TIMEOUT
            )
            response.raise_for_status()
            logger.info(f"Updated workflow {workflow_id}")
            return True
        except RequestException as e:
            logger.error(f"Failed to update workflow {workflow_id}: {e}")
            return False

    @retry_with_backoff()
    def import_workflow(self, workflow_data: Dict[str, Any]) -> Optional[str]:
        """Import a workflow to n8n."""
        url = f"{self.config.api_url}/api/v1/workflows"

        # Clean payload - only include allowed keys
        allowed_keys = ['name', 'nodes', 'connections', 'settings']
        payload = {k: v for k, v in workflow_data.items() if k in allowed_keys}

        try:
            response = requests.post(
                url,
                headers=self.config.headers,
                json=payload,
                timeout=DEFAULT_TIMEOUT
            )
            response.raise_for_status()

            result = response.json()
            logger.info(f"Imported workflow '{result['name']}' (ID: {result['id']})")
            return result['id']
        except RequestException as e:
            logger.error(f"Failed to import workflow: {e}")
            return None

    @retry_with_backoff()
    def get_executions(self, workflow_id: str, limit: int = 10) -> list:
        """
        Fetch recent executions for a workflow.

        Args:
            workflow_id: The workflow ID to get executions for
            limit: Maximum number of executions to return

        Returns:
            List of execution records
        """
        url = f"{self.config.api_url}/api/v1/executions"
        params = {"workflowId": workflow_id, "limit": limit}
        response = requests.get(
            url,
            headers=self.config.headers,
            params=params,
            timeout=DEFAULT_TIMEOUT
        )
        response.raise_for_status()
        return response.json().get('data', [])

    @retry_with_backoff()
    def get_execution_details(self, execution_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch detailed execution data.

        Args:
            execution_id: The execution ID to get details for

        Returns:
            Execution details dict, or None on error
        """
        url = f"{self.config.api_url}/api/v1/executions/{execution_id}"
        try:
            response = requests.get(
                url,
                headers=self.config.headers,
                timeout=DEFAULT_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            logger.error(f"Failed to fetch execution {execution_id}: {e}")
            return None


def require_env_var(name: str) -> Optional[str]:
    """
    Get required environment variable with validation.

    Args:
        name: Environment variable name

    Returns:
        Value if present, None with error log if missing
    """
    load_dotenv()
    value = os.getenv(name)
    if not value:
        logger.error(f"{name} not found in environment")
        return None
    return value
