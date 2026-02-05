import os
import sys
import json
import requests
from dotenv import load_dotenv

# Load env
load_dotenv()

N8N_API_URL = os.getenv("N8N_API_URL", "http://localhost:5678").rstrip('/')
N8N_API_KEY = os.getenv("N8N_API_KEY")
SLACK_BOT_TOKEN = os.getenv("SLACK_BOT_TOKEN")

INPUT_WORKFLOW = "workflows/adapted/newsletter_agent_adapted.json"
# If adapted doesn't exist, fall back to original (but adapted should exist from previous steps)
if not os.path.exists(INPUT_WORKFLOW):
    INPUT_WORKFLOW = "workflows/newsletter_agent.json"

def create_slack_credential():
    if not SLACK_BOT_TOKEN:
        print("Error: SLACK_BOT_TOKEN not found in .env")
        return None

    url = f"{N8N_API_URL}/api/v1/credentials"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Check if exists first? n8n allows duplicates, but better to check names?
    # For simplicity, we just create a new one "Slack API (Antigravity)"
    
    payload = {
        "name": "Slack API (Antigravity)",
        "type": "slackApi",
        "data": {
            "accessToken": SLACK_BOT_TOKEN,
            "notice": ""
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
            
        # Debug: Fetch Schema
        try:
            schema_url = f"{N8N_API_URL}/api/v1/credentials/schema/slackApi"
            s_res = requests.get(schema_url, headers=headers)
            # print(f"Schema for slackApi: {json.dumps(s_res.json(), indent=2)}") 
        except Exception as se:
            print(f"Could not fetch schema: {se}")
            
        return None

def update_workflow(cred_id):
    if not cred_id:
        return

    print(f"Updating workflow '{INPUT_WORKFLOW}' to use Credential ID: {cred_id}...")
    
    with open(INPUT_WORKFLOW, 'r') as f:
        wf = json.load(f)
        
    updated = False
    for node in wf.get('nodes', []):
        # Look for Slack nodes
        if node.get('type') == 'n8n-nodes-base.slack':
            print(f"  - Updating node '{node.get('name')}'")
            node['credentials'] = {
                "slackApi": {
                    "id": cred_id,
                    "name": "Slack API (Antigravity)"
                }
            }
            updated = True
            
    if updated:
        # Save to a temporary file or overwrite?
        # Let's overwrite because we want to import THIS version.
        with open(INPUT_WORKFLOW, 'w') as f:
            json.dump(wf, f, indent=2)
        print("Workflow file updated locally.")
        
        # Now Import
        import_workflow(wf)
    else:
        print("No Slack nodes found to update.")

def import_workflow(wf_data):
    url = f"{N8N_API_URL}/api/v1/workflows"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }
    
    # Import logic (similar to import_workflows.py)
    # Check if exists (by name? ID?)
    # For now, we just POST (import as new). 
    # BUT, if we want to replace the existing one, we should probably PUT to the existing ID if we knew it.
    # The existing import script just POSTs usually.
    # Let's just POST. User can delete old ones.
    
    # To be cleaner: try to find existing ID by name "Content - Newsletter Agent"
    existing_id = find_workflow_id_by_name(wf_data.get('name'))
    
    if existing_id:
        print(f"Found existing workflow '{wf_data.get('name')}' (ID: {existing_id}). Updating...")
        # PUT
        try:
             # PUT requires just the body
             res = requests.put(f"{url}/{existing_id}", headers=headers, json=wf_data)
             res.raise_for_status()
             print("Successfully updated workflow in n8n.")
        except Exception as e:
            print(f"Error updating workflow: {e}")
    else:
        print(f"Importing as new workflow...")
        try:
            res = requests.post(url, headers=headers, json=wf_data)
            res.raise_for_status()
            print(f"Successfully imported (ID: {res.json()['id']})")
        except Exception as e:
            print(f"Error importing workflow: {e}")

def find_workflow_id_by_name(name):
    # Fetch all flows
    try:
        res = requests.get(f"{N8N_API_URL}/api/v1/workflows", headers={"X-N8N-API-KEY": N8N_API_KEY})
        res.raise_for_status()
        flows = res.json().get('data', [])
        for f in flows:
            if f['name'] == name:
                return f['id']
    except:
        pass
    return None

if __name__ == "__main__":
    if not N8N_API_URL or not N8N_API_KEY:
         print("Error: N8N_API_URL or N8N_API_KEY missing.")
         sys.exit(1)
         
    cred_id = create_slack_credential()
    if cred_id:
        update_workflow(cred_id)
