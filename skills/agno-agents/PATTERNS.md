# Agno Agent Patterns

## Pattern 1: Single Expert Agent

Best for focused tasks with one domain.

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from agno.db.sqlite import SqliteDb

travel_expert = Agent(
    name="TravelExpert",
    model=OpenAIChat(id="gpt-4o"),
    db=SqliteDb(db_file="travel.db"),
    learning=True,
    description="Expert travel planner with destination knowledge",
    instructions=[
        "Recommend destinations based on user preferences",
        "Consider seasonality and local events",
        "Provide practical travel tips",
        "Remember user's past trips and preferences",
    ],
)
```

## Pattern 2: Supervisor Team

One agent coordinates others.

```python
from agno.agent import Agent
from agno.team import Team

# Specialist agents
researcher = Agent(
    name="Researcher",
    role="Find destination information",
    model=OpenAIChat(id="gpt-4o-mini"),
    tools=[DuckDuckGoTools()],
)

planner = Agent(
    name="Planner",
    role="Create detailed itineraries",
    model=OpenAIChat(id="gpt-4o"),
)

budgeter = Agent(
    name="Budgeter",
    role="Optimize costs and find deals",
    model=OpenAIChat(id="gpt-4o-mini"),
)

# Supervisor coordinates
supervisor = Agent(
    name="TravelManager",
    role="Coordinate travel planning",
    model=OpenAIChat(id="gpt-4o"),
    team=[researcher, planner, budgeter],
    instructions=[
        "Delegate research tasks to Researcher",
        "Have Planner create the itinerary",
        "Ask Budgeter to optimize costs",
        "Synthesize final recommendation",
    ],
)

team = Team(
    leader=supervisor,
    mode="supervise",  # Leader delegates to team
)
```

## Pattern 3: Sequential Pipeline

Agents process in order.

```python
from agno.team import Team

# Each agent receives output from previous
pipeline = Team(
    agents=[
        Agent(name="Gatherer", ...),   # 1. Gather requirements
        Agent(name="Researcher", ...), # 2. Research options
        Agent(name="Planner", ...),    # 3. Create plan
        Agent(name="Reviewer", ...),   # 4. Review and refine
    ],
    mode="sequential",
)

result = pipeline.run("Plan a honeymoon trip")
```

## Pattern 4: RAG-Enhanced Agent

Agent with knowledge base access.

```python
from agno.agent import Agent
from agno.knowledge.combined import CombinedKnowledge
from agno.knowledge.pdf import PDFKnowledge
from agno.knowledge.website import WebsiteKnowledge
from agno.vectordb.pgvector import PgVector

# Multiple knowledge sources
knowledge = CombinedKnowledge(
    sources=[
        PDFKnowledge(path="./travel_guides/"),
        WebsiteKnowledge(urls=[
            "https://www.lonelyplanet.com/",
        ]),
    ],
    vector_db=PgVector(
        table_name="travel_knowledge",
        db_url="postgresql://...",
    ),
)

# Load knowledge (run once)
knowledge.load(recreate=False)

# Agent with knowledge
agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    knowledge=knowledge,
    search_knowledge=True,
    instructions=["Use knowledge base for accurate recommendations"],
)
```

## Pattern 5: Conversational Memory

Long-running conversations with context.

```python
from agno.agent import Agent
from agno.memory import Memory
from agno.db.postgres import PostgresDb

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    db=PostgresDb(db_url="postgresql://..."),

    # Memory configuration
    memory=Memory(
        # User memories (preferences, facts)
        create_user_memories=True,
        update_user_memories=True,

        # Session memories (conversation context)
        create_session_summary=True,

        # How many messages to keep
        num_history_responses=10,
    ),

    learning=True,
    learning_mode="agentic",  # Agent decides when to learn
)

# Conversation persists across sessions
agent.run("I prefer budget travel", user_id="user_123")
# ... later ...
agent.run("Plan a trip", user_id="user_123")  # Remembers preference
```

## Pattern 6: Async Agent for Long Tasks

Non-blocking operations.

```python
import asyncio
from agno.agent import Agent

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    tools=[...],
)

async def process_multiple():
    tasks = [
        agent.arun("Research Paris"),
        agent.arun("Research Tokyo"),
        agent.arun("Research Sydney"),
    ]
    results = await asyncio.gather(*tasks)
    return results

# Run async
results = asyncio.run(process_multiple())
```

## Pattern 7: Structured Output Agent

Type-safe responses with Pydantic.

```python
from pydantic import BaseModel, Field
from typing import List

class Activity(BaseModel):
    time: str
    title: str
    description: str
    duration_minutes: int
    cost_estimate: float

class DayPlan(BaseModel):
    day_number: int
    theme: str
    activities: List[Activity]

class Itinerary(BaseModel):
    destination: str
    duration_days: int
    total_budget: float
    days: List[DayPlan]

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    response_model=Itinerary,
    instructions=["Create detailed, structured itineraries"],
)

response = agent.run("5-day Japan trip, $3000 budget")
itinerary: Itinerary = response.content

# Type-safe access
for day in itinerary.days:
    print(f"Day {day.day_number}: {day.theme}")
    for activity in day.activities:
        print(f"  {activity.time} - {activity.title}")
```

## Pattern 8: Human-in-the-Loop

Agent requests approval for actions.

```python
from agno.agent import Agent
from agno.tools.function import FunctionTool

def book_hotel(hotel_name: str, dates: str, price: float) -> str:
    """Book a hotel - requires human approval."""
    return f"Booked {hotel_name} for {dates} at ${price}"

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),
    tools=[
        FunctionTool(
            func=book_hotel,
            requires_confirmation=True,  # Pause for approval
        ),
    ],
)

# Agent will pause and ask before booking
agent.print_response("Book a hotel in Paris for next weekend")
```

## Pattern 9: Production API Server

FastAPI with multiple agents.

```python
from agno.agent import Agent
from agno.api import AgnoAPI
from agno.models.openai import OpenAIChat

# Define agents
planner = Agent(
    name="planner",
    model=OpenAIChat(id="gpt-4o"),
    endpoint="/plan",
)

support = Agent(
    name="support",
    model=OpenAIChat(id="gpt-4o-mini"),
    endpoint="/support",
)

# Create API
app = AgnoAPI(
    agents=[planner, support],
    title="Travel API",
    description="AI-powered travel services",
)

# Endpoints created:
# POST /plan - Trip planning
# POST /support - Customer support
# GET /health - Health check

# Run: uvicorn main:app --host 0.0.0.0 --port 8000
```

## Pattern 10: Multi-Modal Agent

Handle images, audio, video.

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat

agent = Agent(
    model=OpenAIChat(id="gpt-4o"),  # Vision-capable model
    instructions=["Analyze travel photos and provide recommendations"],
)

# Analyze image
response = agent.run(
    "What destination is this? What activities would you recommend?",
    images=["./vacation_photo.jpg"],
)

# Or from URL
response = agent.run(
    "Describe this location",
    images=["https://example.com/photo.jpg"],
)
```
