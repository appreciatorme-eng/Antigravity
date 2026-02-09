#!/usr/bin/env python3
import os
import sys
import argparse
from textwrap import dedent

def create_file(path, content):
    with open(path, "w") as f:
        f.write(content.strip() + "\n")
    print(f"Created {path}")

def scaffold_project(project_name):
    if os.path.exists(project_name):
        print(f"Error: Directory '{project_name}' already exists.")
        sys.exit(1)

    os.makedirs(project_name)
    os.chdir(project_name)

    # Directory layout
    dirs = [
        "agents",
        "knowledge",
        "storage",
        "tools",
        "workflows",
        "playground",
        "tests"
    ]
    
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        create_file(os.path.join(d, "__init__.py"), "")
    
    # Requirements
    create_file("requirements.txt", """
agno
openai
python-dotenv
duckduckgo-search
yfinance
chromadb
pgvector
lancedb
pydantic
""".strip())
    
    # Environment file template
    create_file(".env.example", """
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_API_KEY=AI...
DATABASE_URL=postgresql+psycopg://ai:ai@localhost:5532/ai
""".strip())
    
    create_file(".env", "# Add your API keys here\n")

    # README
    create_file("README.md", f"""
# {project_name}

Agno Agent Project

## Setup

1. Create virtualenv: `python -m venv venv`
2. Activate: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Set up `.env` file with API keys.

## Running Agents

check `agents/` for available agents.
Run: `python agents/research_agent.py`
""".strip())

    # Example Agent
    create_file("agents/research_agent.py", """
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools
from dotenv import load_dotenv

load_dotenv()

agent = Agent(
    name="Researcher",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "Search for the topic provided by the user.",
        "Provide a concise summary with bullet points.",
        "Always cite sources."
    ],
    show_tool_calls=True,
    markdown=True,
)

if __name__ == "__main__":
    import sys
    topic = sys.argv[1] if len(sys.argv) > 1 else "What is Agentic AI?"
    agent.print_response(topic)
""".strip())

    # Knowledge Base Example
    create_file("knowledge/knowledge_base.py", """
from agno.knowledge.pdf import PDFUrlKnowledgeBase
from agno.vectordb.lancedb import LanceDb, SearchType

# Example using LanceDB (local vector DB)
knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=LanceDb(
        table_name="recipes",
        uri="tmp/lancedb",
        search_type=SearchType.vector,
    ),
)
""".strip())

    print(f"\nSuccessfully created Agno project: {project_name}")
    print(f"cd {project_name}")
    print("pip install -r requirements.txt")
    print("python agents/research_agent.py")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scaffold a new Agno Agent project")
    parser.add_argument("name", help="Name of the project directory to create")
    
    args = parser.parse_args()
    scaffold_project(args.name)
