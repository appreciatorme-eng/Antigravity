import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

N8N_API_URL = os.getenv("N8N_API_URL", "http://localhost:5678").rstrip('/')
N8N_API_KEY = os.getenv("N8N_API_KEY")

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")

# Note: Bucket name isn't part of the credential, it's used in the node.
# But we can print it for verification.
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

def create_aws_credential():
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("Error: AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not found in .env")
        return None

    url = f"{N8N_API_URL}/api/v1/credentials"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "name": "AWS S3", # Matching the name expected by workflows
        "type": "aws",
        "data": {
            "accessKeyId": AWS_ACCESS_KEY_ID,
            "secretAccessKey": AWS_SECRET_ACCESS_KEY,
            "region": AWS_REGION or "us-east-1" 
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        cred = response.json()
        print(f"Success: Created Credential '{cred['name']}' (ID: {cred['id']})")
        return cred['id']
    except Exception as e:
        print(f"Error creating credential: {e}")
        if hasattr(e, 'response') and e.response is not None:
             print(f"Response: {e.response.text}")
        return None

if __name__ == "__main__":
    if not N8N_API_URL or not N8N_API_KEY:
         print("Error: N8N_API_URL or N8N_API_KEY missing.")
         sys.exit(1)
    
    print(f"Configuring AWS S3 (Bucket: {AWS_BUCKET_NAME}, Region: {AWS_REGION})")
    create_aws_credential()
