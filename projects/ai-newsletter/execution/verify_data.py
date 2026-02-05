import requests
import os
import json
from dotenv import load_dotenv

load_dotenv(".env")

N8N_API_KEY = os.getenv("N8N_API_KEY")
N8N_API_URL = os.getenv("N8N_API_URL", "http://localhost:5678")

headers = {
    "X-N8N-API-KEY": N8N_API_KEY
}

def check_ingestion_logs():
    wf_id = "9qGuJh8HAnxXA8zH" # AI News Data Ingestion
    print(f"\n--- Checking Ingestion Workflow (ID: {wf_id}) ---")
    try:
        res = requests.get(f"{N8N_API_URL}/api/v1/executions", headers=headers, params={"workflowId": wf_id, "limit": 3})
        executions = res.json().get('data', [])
        
        if not executions:
            print("No recent executions found.")
        else:
            for exe in executions:
                status = exe.get('finished') and 'Finished' or 'Running'
                print(f"ID: {exe['id']} | Status: {status} | Mode: {exe['mode']}")
                if status == 'Finished':
                    # Check for error
                    try:
                        d_res = requests.get(f"{N8N_API_URL}/api/v1/executions/{exe['id']}", headers=headers)
                        data = d_res.json().get('data', {})
                        result_data = data.get('resultData', {})
                        err = result_data.get('error')
                        
                        if err:
                             print(f"  ❌ ERROR: {err.get('message')}")
                        else:
                             print("  ✅ Success")
                    except Exception as e:
                        print(f"  Error fetching details: {e}")
    except Exception as e:
        print(f"Error checking logs: {e}")

if __name__ == "__main__":
    check_ingestion_logs()
