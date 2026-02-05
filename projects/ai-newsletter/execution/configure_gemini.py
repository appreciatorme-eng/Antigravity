"""Configure Google Gemini credentials in n8n."""
import sys
from n8n_utils import N8NClient, require_env_var, logger


def main():
    api_key = require_env_var("GOOGLE_GEMINI_API_KEY")
    if not api_key:
        sys.exit(1)

    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    # Note: n8n uses "googlePalmApi" type for Gemini credentials
    cred_id = client.create_credential(
        name="Google Gemini Attributes",
        cred_type="googlePalmApi",
        data={
            "apiKey": api_key,
            "host": "generativelanguage.googleapis.com"
        }
    )

    if cred_id:
        logger.info(f"Google Gemini credential configured successfully: {cred_id}")
    else:
        logger.error("Failed to configure Google Gemini credential")
        sys.exit(1)


if __name__ == "__main__":
    main()
