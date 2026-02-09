---
description: Build autonomous AI agents using the Agno framework (formerly Phidata) with tools, memory, and knowledge.
---

# Agno Skill

This skill provides a comprehensive guide for building AI agents using **Agno**. Agno is a framework for building multi-modal Agents that have memory, knowledge, and tools.

## 🚀 Quick Start

### 1. Installation

Agno requires Python 3.9+.

```bash
pip install -U agno
```

For specific integrations (like OpenAI, DuckDuckGo):
```bash
pip install -U agno openai duckduckgo-search
```

### 2. Basic Agent

Create a file `agent.py`:

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    description="You are an enthusiastic AI assistant.",
    markdown=True
)

agent.print_response("Share a fun fact about space.")
```

Run it:
```bash
python agent.py
```

---

## 🏗️ Project Structure

For scalable agent development, use this recommended directory structure:

```text
my-agent-project/
├── agents/                 # Agent definitions
│   ├── web_search.py
│   └── researcher.py
├── tools/                  # Custom tools
│   └── my_tools.py
├── knowledge/              # Knowledge / RAG setup
│   └── pdf_knowledge.py
├── storage/                # Database/Memory storage
│   └── db_setup.py
├── workflows/              # Multi-agent workflows
│   └── team.py
├── .env                    # Environment variables (API keys)
└── requirements.txt
```

---

## 🛠️ Core Concepts

### 1. Agents
Agents are stateful entities that can reason and execute tasks. They can be configured with:
- **Model**: The LLM backend (OpenAI, Gemini, Anthropic, Ollama).
- **Tools**: Functions they can call.
- **Knowledge**: RAG capabilities (Vector DBs).
- **Memory**: Persistent chat history (Storage).

**Example: Agent with Tools**
```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    show_tool_calls=True,
    markdown=True
)

agent.print_response("What's the latest news on fusion energy?")
```

### 2. Knowledge (RAG)
Agents can search documents using vector databases.

**Setup with PgVector (PostgreSQL):**
```python
from agno.agent import Agent
from agno.knowledge.pdf import PDFUrlKnowledgeBase
from agno.vectordb.pgvector import PgVector

db_url = "postgresql+psycopg://ai:ai@localhost:5532/ai"

knowledge_base = PDFUrlKnowledgeBase(
    urls=["https://agno-public.s3.amazonaws.com/recipes/ThaiRecipes.pdf"],
    vector_db=PgVector(table_name="recipes", db_url=db_url)
)
# Load knowledge (run once)
knowledge_base.load(recreate=True)

agent = Agent(
    knowledge=knowledge_base,
    search_knowledge=True
)
agent.print_response("How do I make Pad Thai?")
```

### 3. Storage (Memory)
Agents forget history by default. Use Storage to persist sessions.

**Setup with SQLite:**
```python
from agno.storage.agent.sqlite import SqliteAgentStorage

agent = Agent(
    storage=SqliteAgentStorage(table_name="agent_sessions", db_file="agents.db"),
    add_history_to_messages=True,
    session_id="user_session_1"
)
```

---

## 📚 Example: Research Assistant

This example creates a research assistant that uses DuckDuckGo for search and generic tools for file handling.

File: `agents/researcher.py`

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.tools.duckduckgo import DuckDuckGoTools

research_agent = Agent(
    name="Researcher",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()],
    instructions=[
        "Search for the topic provided by the user.",
        "Summarize the key findings in bullet points.",
        "Cite sources with URLs."
    ],
    markdown=True,
    show_tool_calls=True
)

if __name__ == "__main__":
    research_agent.print_response("Research the latest advancements in solid-state batteries.")
```

---

## 🤝 Multi-Agent Teams

Agno allows multiple agents to work together.

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat

web_agent = Agent(
    name="Web Agent",
    role="Search the web",
    model=OpenAIChat(id="gpt-4o"),
    tools=[DuckDuckGoTools()]
)

finance_agent = Agent(
    name="Finance Agent",
    role="Get financial data",
    model=OpenAIChat(id="gpt-4o"),
    tools=[YFinanceTools(stock_price=True)]
)

team = Agent(
    team=[web_agent, finance_agent],
    model=OpenAIChat(id="gpt-4o"),
    instructions=["Use the web agent for news and finance agent for stock data."]
)

team.print_response("What is the stock price of NVDA and recent news about it?")
```

---

## 🔧 Useful Scripts

### Scaffold New Project
Use the included script `scripts/scaffold_agno.py` to create a new project structure:

```bash
python skills/agno/scripts/scaffold_agno.py my_new_agent
```

---

## ⚠️ Troubleshooting

1. **API Key Errors**: Ensure `OPENAI_API_KEY` is set in your environment file `.env`.
2. **Database Connection**: For PgVector, ensure PostgreSQL is running (`docker run -d -p 5532:5432 -e POSTGRES_PASSWORD=ai pgvector/pgvector:pg16`).
3. **Import Errors**: Agno is rapidly evolving. Check the [official docs](https://docs.agno.com) for the latest API changes.
