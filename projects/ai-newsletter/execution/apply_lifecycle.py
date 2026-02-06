"""
Apply S3 Lifecycle Policies for Cost Optimization.

This script configures the S3 bucket to automatically expire temporary files
and logs, ensuring storage costs remain minimal.
"""
import sys
import boto3
from botocore.exceptions import ClientError
try:
    from execution.n8n_utils import require_env_var, logger
except ImportError:
    from n8n_utils import require_env_var, logger

def apply_lifecycle_policy():
    """Apply lifecycle rules to the configured S3 bucket."""
    bucket_name = require_env_var("AWS_BUCKET_NAME")
    aws_access_key = require_env_var("AWS_ACCESS_KEY_ID")
    aws_secret_key = require_env_var("AWS_SECRET_ACCESS_KEY")
    aws_region = require_env_var("AWS_REGION")

    if not all([bucket_name, aws_access_key, aws_secret_key, aws_region]):
        logger.error("Missing required AWS environment variables.")
        sys.exit(1)

    s3 = boto3.client(
        's3',
        aws_access_key_id=aws_access_key,
        aws_secret_access_key=aws_secret_key,
        region_name=aws_region
    )

    lifecycle_config = {
        'Rules': [
            {
                'ID': 'DeleteTempFiles',
                'Status': 'Enabled',
                'Filter': {
                    'Prefix': '.temp/'
                },
                'Expiration': {
                    'Days': 7
                }
            },
            {
                'ID': 'DeleteOldLogs',
                'Status': 'Enabled',
                'Filter': {
                    'Prefix': 'logs/'
                },
                'Expiration': {
                    'Days': 30
                }
            }
        ]
    }

    try:
        logger.info(f"Applying lifecycle policy to bucket: {bucket_name}")
        s3.put_bucket_lifecycle_configuration(
            Bucket=bucket_name,
            LifecycleConfiguration=lifecycle_config
        )
        logger.info("Successfully applied S3 lifecycle policies.")
        
        # Verification: Print the applied rules
        response = s3.get_bucket_lifecycle_configuration(Bucket=bucket_name)
        for rule in response.get('Rules', []):
            logger.info(f"Rule '{rule['ID']}': Expires in {rule['Expiration']['Days']} days")
            
    except ClientError as e:
        logger.error(f"Failed to apply lifecycle policy: {e}")
        sys.exit(1)

if __name__ == "__main__":
    apply_lifecycle_policy()
