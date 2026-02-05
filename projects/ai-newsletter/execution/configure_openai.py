"""Configure OpenAI credentials in n8n."""
import sys
from n8n_utils import N8NClient, require_env_var, logger


def main():
    api_key = require_env_var("OPENAI_API_KEY")
    if not api_key:
        sys.exit(1)

    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    cred_id = client.create_credential(
        name="OpenAI API (Antigravity)",
        cred_type="openAiApi",
        data={
            "apiKey": api_key,
            "url": "https://api.openai.com/v1",
            "header": False
        }
    )

    if cred_id:
        logger.info(f"OpenAI credential configured successfully: {cred_id}")
    else:
        logger.error("Failed to configure OpenAI credential")
        sys.exit(1)


if __name__ == "__main__":
    main()
