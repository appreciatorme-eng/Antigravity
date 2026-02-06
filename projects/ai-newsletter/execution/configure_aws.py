"""Configure AWS S3 credentials in n8n."""
import os
import sys
try:
    from execution.n8n_utils import N8NClient, require_env_var, logger
except ImportError:
    from n8n_utils import N8NClient, require_env_var, logger
from dotenv import load_dotenv


def main():
    load_dotenv()

    access_key = require_env_var("AWS_ACCESS_KEY_ID")
    secret_key = require_env_var("AWS_SECRET_ACCESS_KEY")

    if not access_key or not secret_key:
        sys.exit(1)

    # Optional: region and bucket name for logging
    region = os.getenv("AWS_REGION", "us-east-1")
    bucket_name = os.getenv("AWS_BUCKET_NAME")

    logger.info(f"Configuring AWS S3 (Bucket: {bucket_name}, Region: {region})")

    try:
        client = N8NClient()
    except ValueError:
        sys.exit(1)

    cred_id = client.create_credential(
        name="AWS S3",
        cred_type="aws",
        data={
            "accessKeyId": access_key,
            "secretAccessKey": secret_key,
            "region": region
        }
    )

    if cred_id:
        logger.info(f"AWS S3 credential configured successfully: {cred_id}")
    else:
        logger.error("Failed to configure AWS S3 credential")
        sys.exit(1)


if __name__ == "__main__":
    main()
