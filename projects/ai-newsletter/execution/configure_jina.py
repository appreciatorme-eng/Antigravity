"""Configure Jina AI credentials in n8n."""
import sys
try:
    from execution.n8n_utils import N8NClient, require_env_var, logger
except ImportError:
    from n8n_utils import N8NClient, require_env_var, logger


def main():
    api_key = require_env_var("JINA_API_KEY")
    if not api_key:
        sys.exit(1)

    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    # Jina uses HTTP Header Auth in n8n
    cred_id = client.create_credential(
        name="Jina AI API",
        cred_type="httpHeaderAuth",
        data={
            "name": "Authorization",
            "value": f"Bearer {api_key}"
        }
    )

    if cred_id:
        logger.info(f"Jina AI credential configured successfully: {cred_id}")
    else:
        logger.error("Failed to configure Jina AI credential")
        sys.exit(1)


if __name__ == "__main__":
    main()
