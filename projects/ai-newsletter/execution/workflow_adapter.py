import json
import os
import copy

# Configuration
INPUT_DIR = "workflows"
OUTPUT_DIR = "workflows/adapted"
GEMINI_MODEL = "models/gemini-1.5-flash"
GEMINI_CRED_NAME = "Google Gemini Attributes" # Matches the name you'll give in n8n
S3_CRED_NAME = "AWS S3" # Matches the name you'll give in n8n

def load_workflow(filename):
    with open(filename, 'r') as f:
        return json.load(f)

def save_workflow(data, filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)

def adapt_scraping_pipeline(workflow):
    print("Adapting Scraping Pipeline...")
    nodes = workflow.get('nodes', [])
    new_nodes = []
    
    for node in nodes:
        # 1. Replace 'scrape_url' (executeWorkflow) with Jina AI HTTP Request
        if node.get('name') == 'scrape_url' and node.get('type') == 'n8n-nodes-base.executeWorkflow':
            print("  - Replacing 'scrape_url' with Jina AI HTTP Request")
            node['type'] = 'n8n-nodes-base.httpRequest'
            node['typeVersion'] = 4.2
            node['parameters'] = {
                "method": "GET",
                "url": "={{ 'https://r.jina.ai/' + $json.url }}",
                "authentication": "none", # Jina is free/no-auth for basic use
                "options": {
                    "responseFormat": "json" # Jina returns JSON if Accept header? Or plain text? 
                                            # Jina Reader returns Markdown by default.
                                            # Actually r.jina.ai returns text/plain usually.
                                            # But if we use https://r.jina.ai/URL it returns the text.
                                            # Let's verify Jina behavior.
                                            # Usually it returns the markdown content in the body.
                }
            }
            # Adjust output parsing if necessary. The original node outputted 'data.json.content'
            # We might need a Set node after to map Jina output to 'data.json.content' structure 
            # OR adjust downstream nodes.
            # Downstream 'evaluate_content' uses: {{ $json.data.json.content }}
            # If we change this node, we should try to match the output structure or update downstream.
            # Easier to update this node to output { "data": { "json": { "content": "..." } } } ?
            # HTTP Request node outputs body.
            # We can use a Function/Code node to reshape it? 
            # Or just update the httpRequest to put response in a property?
            node['parameters']['options']['responsePropertyName'] = 'content' 
            # usage: https://r.jina.ai/<url>
            
            # Use a Set node or Code node to restructure?
            # Actually, let's keep it simple. We will add a 'set' node after this in the connections?
            # No, inserting nodes is hard (coordinates).
            # Best is to just change the downstream references?
            # 'evaluate_content' uses {{ $json.data.json.content }}
            # Let's change 'evaluate_content' parameter to {{ $json.content }}
            
        # 2. Update downstream references to 'scrape_url'
        if node.get('name') == 'evaluate_content':
            # Original: {{ $json.data.json.content }}
            # New Jina: {{ $json.content }} (assuming we put response in 'content')
            if 'parameters' in node and 'text' in node['parameters']:
                print("  - Updating 'evaluate_content' reference")
                node['parameters']['text'] = node['parameters']['text'].replace('$json.data.json.content', '$json.content')

        # 3. Handle 'api.aitools.inc' calls - Replace with direct S3 or ignore
        # The 'copy_markdown' and 'copy_html' nodes were using aitools API to copy files in S3/R2?
        # If we use standard S3, we might not need this "copy" logic if we upload to the right place initially.
        # But 'upload_temp_markdown' uploads to .temp.
        # 'copy_markdown' copies .temp to .md and sets metadata.
        # We can try to replace 'copy_markdown' with an S3 Copy Object node if available, or just Python/AWS node.
        # For now, let's just update the S3 credentials for 'upload_temp_markdown'.
        
        if node.get('type') == 'n8n-nodes-base.s3':
             print(f"  - Updating Credentials for S3 node: {node.get('name')}")
             node['credentials'] = {
                 "s3": {
                     "id": "AWS_S3_CRED_ID", # Placeholder, relies on name mapping in import
                     "name": S3_CRED_NAME
                 }
             }
             # Update bucket name if needed? User said "S3 Bucket". 
             # We should probably use a parameter or env var for bucket name.
             # existing is "data-ingestion".
        
        new_nodes.append(node)
        
    workflow['nodes'] = new_nodes
    return workflow

def adapt_newsletter_agent(workflow):
    print("Adapting Newsletter Agent...")
    nodes = workflow.get('nodes', [])
    new_nodes = []
    
    for node in nodes:
        # 1. Replace LLM nodes (Claude/OpenAI) with Gemini
        if node.get('type') in ['@n8n/n8n-nodes-langchain.lmChatAnthropic', '@n8n/n8n-nodes-langchain.lmChatOpenAi']:
            print(f"  - Replacing LLM node '{node.get('name')}' with Gemini")
            node['type'] = '@n8n/n8n-nodes-langchain.lmChatGoogleGemini'
            node['typeVersion'] = 1
            node['parameters'] = {
                "modelName": GEMINI_MODEL,
                "options": {}
            }
            node['credentials'] = {
                "googlePalmApi": {
                    "id": "GOOGLE_GEMINI_CRED_ID", 
                    "name": GEMINI_CRED_NAME
                }
            }
        
        # 2. Update existing Gemini nodes (if any) to ensure correct model/creds
        if node.get('type') == '@n8n/n8n-nodes-langchain.lmChatGoogleGemini':
             print(f"  - Updating existing Gemini node '{node.get('name')}'")
             node['parameters']['modelName'] = GEMINI_MODEL
             node['credentials'] = {
                "googlePalmApi": {
                    "id": "GOOGLE_GEMINI_CRED_ID", 
                    "name": GEMINI_CRED_NAME
                }
            }
             
        # 3. Update S3 nodes
        if node.get('type') == 'n8n-nodes-base.s3':
             print(f"  - Updating Credentials for S3 node: {node.get('name')}")
             node['credentials'] = {
                 "s3": {
                     "id": "AWS_S3_CRED_ID",
                     "name": S3_CRED_NAME
                 }
             }

        new_nodes.append(node)

    workflow['nodes'] = new_nodes
    return workflow

if __name__ == "__main__":
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Process Scraping Pipeline
    try:
        scraping_wf = load_workflow(f"{INPUT_DIR}/scraping_pipeline.json")
        adapted_scraping = adapt_scraping_pipeline(scraping_wf)
        save_workflow(adapted_scraping, f"{OUTPUT_DIR}/scraping_pipeline_adapted.json")
        print("Success: scraping_pipeline_adapted.json")
    except Exception as e:
        print(f"Error adapting scraping pipeline: {e}")

    # Process Newsletter Agent
    try:
        newsletter_wf = load_workflow(f"{INPUT_DIR}/newsletter_agent.json")
        adapted_newsletter = adapt_newsletter_agent(newsletter_wf)
        save_workflow(adapted_newsletter, f"{OUTPUT_DIR}/newsletter_agent_adapted.json")
        print("Success: newsletter_agent_adapted.json")
    except Exception as e:
        print(f"Error adapting newsletter agent: {e}")
