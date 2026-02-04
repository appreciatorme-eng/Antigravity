import os
import sys
import requests
import json
from dotenv import load_dotenv

# Load env variables from current directory or parent directories
load_dotenv()

N8N_API_URL = os.getenv("N8N_API_URL")
N8N_API_KEY = os.getenv("N8N_API_KEY")

if not N8N_API_URL or not N8N_API_KEY:
    print("Error: N8N_API_URL or N8N_API_KEY not found in environment variables")
    sys.exit(1)

# Ensure URL doesn't end with slash
N8N_API_URL = N8N_API_URL.rstrip('/')

def create_workflow(name, nodes, connections):
    url = f"{N8N_API_URL}/api/v1/workflows"
    headers = {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json"
    }
    
    payload = {
        "name": name,
        "nodes": nodes,
        "connections": connections,
        "settings": {},
        "staticData": None
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}")
        print(f"Response: {e.response.text}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

# Define a simple Hello World workflow
# Trigger: Manual
# Action: Sticky Note "Hello from Antigravity"

nodes = [
    {
        "parameters": {},
        "id": "Manual Trigger",
        "name": "When clicking \"Execute Workflow\"",
        "type": "n8n-nodes-base.manualTrigger",
        "typeVersion": 1,
        "position": [460, 460]
    },
    {
        "parameters": {
            "content": "## Hello from Antigravity! 🚀\n\nI created this workflow using the n8n API."
        },
        "id": "Sticky Note",
        "name": "Sticky Note",
        "type": "n8n-nodes-base.stickyNote",
        "typeVersion": 1,
        "position": [680, 460]
    }
]

connections = {}

if __name__ == "__main__":
    print(f"Attempting to create workflow 'Antigravity Test' on {N8N_API_URL}...")
    result = create_workflow("Antigravity Hello World", nodes, connections)
    print("Success! Workflow created.")
    print(f"ID: {result['id']}")
    print(f"Name: {result['name']}")
    print(f"Active: {result['active']}")
