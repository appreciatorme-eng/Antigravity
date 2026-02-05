# AI Newsletter (Low-Cost Cloud Edition)

This project contains **n8n workflows** and **python helper scripts** to run a fully automated AI newsletter agent.

## Stack
- **Scraping**: [Jina AI Reader](https://jina.ai/reader/) (Replaces costly scraping APIs)
- **Data Lake**: AWS S3 (Stores raw HTML and Markdown)
- **AI Core**: Google Gemini 1.5 Flash (Large context, cost-efficient)
- **Notification**: Slack

## Project Structure
```
projects/ai-newsletter/
├── execution/
│   ├── workflow_adapter.py    # Adapts raw n8n JSONs to use Jina/Gemini/S3
│   └── import_workflows.py    # Imports adapted workflows to local n8n instance
├── workflows/
│   ├── scraping_pipeline.json # Original File
│   ├── newsletter_agent.json  # Original File
│   └── adapted/               # Generated (Optimized) Workflows
├── .env.example               # Configuration template
└── README.md                  # This file
```

## Setup

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env` and fill in your `N8N_API_KEY`.
   ```bash
   cp .env.example .env
   ```
   *(Note: The adaptation script uses this to connect to n8n, but the actual AWS/Gemini keys are configured inside n8n UI)*.

3. **Adapt & Import**
   Run the following to generate optimized workflows and upload them to n8n:
   ```bash
   python execution/workflow_adapter.py
   python execution/import_workflows.py
   ```

## n8n Configuration
After importing, you must configure these Credentials in the n8n UI:
- **AWS S3** (Name: `AWS S3`)
- **Google Gemini** (Name: `Google Gemini Attributes`)
- **Slack** (Name: `Slack API`)

## Testing & Verification

### Run Unit Tests
```bash
pytest
```

### Verify RSS Feed
```bash
python execution/verify_rss.py
```

### Verify Data Ingestion
```bash
python execution/verify_data.py
```
