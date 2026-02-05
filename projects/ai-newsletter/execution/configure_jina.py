import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

N8N_API_URL = os.getenv("N8N_API_URL", "http://localhost:5678").rstrip('/')
N8N_API_KEY = os.getenv("N8N_API_KEY")
JINA_API_KEY = os.getenv("JINA_API_KEY")

def create_jina_credential():
    if not JINA_API_KEY:
        print("Error: JINA_API_KEY not found in .env")
        return None

    url = f"{N8N_API_URL}/api/v1/credentials"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    # Jina usually uses "Header Auth" in n8n if there isn't a specific node, 
    # BUT modern n8n might have a "Jina" node. 
    # Let's assume we used the Header Auth or a specific Jina type in adaptation.
    # Looking at adapter, we might have used 'jinaApi' or just HTTP Header?
    # Let's try 'jinaApi' first if it exists, otherwise fallback to Header Auth logic if we knew the implementation.
    # Actually, the adapter usually configures HTTP Request nodes with "Header Auth".
    # But let's check if there is a specific Jina credential type.
    # If not, we might need to create a "Header Auth" credential.
    
    # Common n8n pattern for generic services: "httpHeaderAuth"
    # Name: "Jina AI API"
    payload = {
        "name": "Jina AI API",
        "type": "httpHeaderAuth", 
        "data": {
            "name": "Authorization",
            "value": f"Bearer {JINA_API_KEY}"
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
         
    create_jina_credential()
