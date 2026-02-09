# Agno Multi-Agent Framework Skill

Use this skill when building Python-based AI agents with persistent memory and learning capabilities.

## When to Use
- Building AI agents that need to remember users across sessions
- Creating multi-agent teams that collaborate
- Developing agentic RAG applications
- Building production AI backends with FastAPI
- Need model-agnostic agent implementation (OpenAI, Anthropic, Google, local)

## Installation

```bash
pip install agno
```

## Quick Start

### Basic Agent with Memory
```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.db.sqlite import SqliteDb

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    db=SqliteDb(db_file="agents.db"),
    learning=True,  # Enable persistent memory
    description="A helpful travel assistant",
    instructions=[
        "Be friendly and concise",
        "Remember user preferences",
    ],
)

# Run agent
response = agent.run("Plan a trip to Paris")
print(response.content)
```

### Agent with Tools
```python
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.calculator import Calculator

agent = Agent(
    model=Claude(id="claude-sonnet-4-20250514"),
    tools=[DuckDuckGoTools(), Calculator()],
    show_tool_calls=True,
    markdown=True,
)

agent.print_response("What's the weather in Tokyo and convert 100 USD to JPY?")
```

### Multi-Agent Team
```python
from agno.agent import Agent
from agno.team import Team
from agno.models.openai import OpenAIChat

# Create specialized agents
researcher = Agent(
    name="Researcher",
    model=OpenAIChat(id="gpt-4o"),
    instructions=["Research topics thoroughly", "Cite sources"],
)

writer = Agent(
    name="Writer",
    model=OpenAIChat(id="gpt-4o"),
    instructions=["Write engaging content", "Keep it concise"],
)

# Create team
team = Team(
    agents=[researcher, writer],
    instructions=["Collaborate to produce quality content"],
)

team.print_response("Write a blog post about AI agents")
```

### Agentic RAG
```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.knowledge.pdf import PDFKnowledge
from agno.vectordb.pgvector import PgVector

# Create knowledge base from PDFs
knowledge = PDFKnowledge(
    path="./documents",
    vector_db=PgVector(
        table_name="documents",
        db_url="postgresql://user:pass@localhost/db"
    ),
)

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge,
    search_knowledge=True,  # Enable RAG
)

agent.print_response("What does the contract say about termination?")
```

### Production FastAPI Server
```python
from agno.agent import Agent
from agno.api import AgnoAPI
from agno.models.openai import OpenAIChat

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    name="TravelBot",
)

# Create FastAPI app
app = AgnoAPI(agents=[agent])

# Run with: uvicorn main:app --reload
```

## Model Providers

```python
# OpenAI
from agno.models.openai import OpenAIChat
model = OpenAIChat(id="gpt-4o")

# Anthropic
from agno.models.anthropic import Claude
model = Claude(id="claude-sonnet-4-20250514")

# Google
from agno.models.google import Gemini
model = Gemini(id="gemini-2.0-flash")

# Groq (fast inference)
from agno.models.groq import Groq
model = Groq(id="llama-3.3-70b-versatile")

# Local via Ollama
from agno.models.ollama import Ollama
model = Ollama(id="llama3.2")
```

## Built-in Tools (100+)

```python
# Web Search
from agno.tools.duckduckgo import DuckDuckGoTools
from agno.tools.googlesearch import GoogleSearchTools

# Data
from agno.tools.sql import SQLTools
from agno.tools.pandas import PandasTools

# Communication
from agno.tools.email import EmailTools
from agno.tools.slack import SlackTools

# Files
from agno.tools.file import FileTools
from agno.tools.pdf import PDFTools

# APIs
from agno.tools.api import APITools
from agno.tools.http import HTTPTools
```

## Vector Databases

```python
# PostgreSQL with pgvector
from agno.vectordb.pgvector import PgVector

# Pinecone
from agno.vectordb.pinecone import Pinecone

# Qdrant
from agno.vectordb.qdrant import Qdrant

# ChromaDB
from agno.vectordb.chroma import ChromaDB

# Supabase
from agno.vectordb.supabase import SupabaseVectorDb
```

## Agent Memory & Learning

```python
from agno.agent import Agent
from agno.db.postgres import PostgresDb

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    db=PostgresDb(db_url="postgresql://..."),

    # Memory options
    learning=True,           # Learn from interactions
    read_user_memories=True, # Access user-specific memories
    update_user_memories=True, # Update memories after conversations

    # Learning modes
    learning_mode="always",  # or "agentic" (agent decides when to learn)
)
```

## Type-Safe I/O with Pydantic

```python
from pydantic import BaseModel
from agno.agent import Agent

class TripPlan(BaseModel):
    destination: str
    days: int
    activities: list[str]
    budget: float

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    response_model=TripPlan,  # Structured output
)

response = agent.run("Plan a 5-day trip to Japan")
plan: TripPlan = response.content
print(f"Going to {plan.destination} for {plan.days} days")
```

## Use Cases for Travel-Suite

### 1. Intelligent Trip Planner Agent
```python
from agno.agent import Agent
from agno.models.google import Gemini
from agno.tools.duckduckgo import DuckDuckGoTools

trip_planner = Agent(
    name="TripPlanner",
    model=Gemini(id="gemini-2.0-flash"),
    tools=[DuckDuckGoTools()],
    learning=True,
    instructions=[
        "Remember user travel preferences",
        "Consider budget constraints",
        "Include local recommendations",
    ],
)
```

### 2. Multi-Agent Travel Team
```python
researcher = Agent(name="Researcher", ...)  # Finds destinations
planner = Agent(name="Planner", ...)        # Creates itineraries
budgeter = Agent(name="Budgeter", ...)      # Optimizes costs

travel_team = Team(
    agents=[researcher, planner, budgeter],
    instructions=["Create comprehensive, budget-friendly trips"],
)
```

### 3. Customer Support with RAG
```python
from agno.knowledge.text import TextKnowledge

support_agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=TextKnowledge(
        texts=["FAQ content", "Policy documents"],
    ),
    search_knowledge=True,
    instructions=["Answer customer questions using knowledge base"],
)
```

## Environment Variables

```bash
# Required for respective providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
GROQ_API_KEY=...
```

## Resources

- **Docs**: https://docs.agno.com
- **GitHub**: https://github.com/agno-agi/agno
- **Examples**: https://github.com/agno-agi/agno/tree/main/examples
- **Discord**: https://discord.gg/agno
