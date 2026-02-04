import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env")

N8N_HOST = os.getenv("N8N_API_URL", "http://localhost:5678")
N8N_API_KEY = os.getenv("N8N_API_KEY")

HEADERS = {
    "X-N8N-API-KEY": N8N_API_KEY,
    "Content-Type": "application/json"
}

WORKFLOWS_DIR = "workflows/adapted"

def import_workflow(filepath):
    with open(filepath, 'r') as f:
        workflow_data = json.load(f)
    
    # Check if workflow exists? (Assuming simpler to just create new or update if ID exists)
    # If ID exists in JSON, n8n might update it or create duplicate with new ID?
    # Usually POST /workflows creates new.
    # PUT /workflows/{id} updates.
    # We should probably strip ID to create new, or try to update if we know ID.
    # The JSONs have "id".
    
    # Let's clean the JSON for import: remove 'id' to always create new, 
    # OR keep it and try to update?
    # Usually easier to just create new to avoid conflicts.
    # But references between workflows need IDs!
    # "scrape_url" calls "qVEM2rCD1jlJPeRs".
    # I need to ensure the "Scrape Url" workflow gets that ID or I update the caller.
    
    # NOTE: "ai_news_data_ingestion.json" (Scraping Pipeline) calls "qVEM2rCD1jlJPeRs".
    # But I don't have that workflow?
    # Wait, I realized "scrape_url" in "ai_news_data_ingestion.json" was REPLACED by Jina logic in adapter.
    # So I don't need to worry about that sub-workflow reference! 
    # Great!
    
    # So I can strip 'id' and let n8n assign new ones?
    # Or keep 'id' to be safe?
    # Let's try to keeping 'id' but use POST /workflows/import if available?
    # API docs: POST /workflows
    
    # Remove 'id' to avoid "duplicate key" error if n8n enforces unique IDs strictly
    if 'id' in workflow_data:
        del workflow_data['id']
    
    # Sanitize payload: keep only allowed keys
    # 'tags' caused read-only error. 'staticData' is often not needed on import.
    allowed_keys = ['name', 'nodes', 'connections', 'settings']
    payload = {k: v for k, v in workflow_data.items() if k in allowed_keys}
        
    response = requests.post(f"{N8N_HOST}/api/v1/workflows", headers=HEADERS, json=payload)
    
    if response.status_code == 200:
        wf_id = response.json()['id']
        name = response.json()['name']
        print(f"Successfully imported '{name}' (ID: {wf_id})")
        return wf_id
    else:
        print(f"Failed to import {filepath}: {response.text}")
        return None

if __name__ == "__main__":
    if not N8N_API_KEY:
        print("Error: N8N_API_KEY not found in .env")
        exit(1)

    print(f"Connected to n8n at {N8N_HOST}")
    
    # Order matters?
    # Scraping pipeline first?
    files = [f for f in os.listdir(WORKFLOWS_DIR) if f.endswith('.json')]
    
    for f in files:
        import_workflow(os.path.join(WORKFLOWS_DIR, f))
