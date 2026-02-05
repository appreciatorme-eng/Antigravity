import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load env variables
load_dotenv()

N8N_API_URL = os.getenv("N8N_API_URL", "http://localhost:5678").rstrip('/')
N8N_API_KEY = os.getenv("N8N_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def create_openai_credential():
    if not OPENAI_API_KEY:
        print("Error: OPENAI_API_KEY not found in .env")
        return None

    url = f"{N8N_API_URL}/api/v1/credentials"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "name": "OpenAI API (Antigravity)",
        "type": "openAiApi",
        "data": {
            "apiKey": OPENAI_API_KEY,
            "url": "https://api.openai.com/v1",
            "header": False
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
             if e.response.status_code == 400:
                 # Debug schema
                 try:
                    s_res = requests.get(f"{N8N_API_URL}/api/v1/credentials/schema/openAiApi", headers=headers)
                    print(f"Schema: {json.dumps(s_res.json(), indent=2)}")
                 except:
                    pass
        return None

if __name__ == "__main__":
    if not N8N_API_URL or not N8N_API_KEY:
         print("Error: N8N_API_URL or N8N_API_KEY missing.")
         sys.exit(1)
         
    create_openai_credential()
