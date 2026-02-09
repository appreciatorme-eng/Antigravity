# Agno Agents Skill

A skill for building multi-agent AI systems with persistent memory using the Agno framework.

## Files

- `SKILL.md` - Main skill reference with code examples
- `PATTERNS.md` - Common agent patterns and architectures
- `INTEGRATIONS.md` - Integration patterns with other services

## Quick Reference

```bash
# Install
pip install agno

# Basic agent
from agno.agent import Agent
from agno.models.openai import OpenAIChat

agent = Agent(model=OpenAIChat(id="gpt-4o"), learning=True)
agent.print_response("Hello!")
```

## When to Use Agno vs Other Frameworks

| Use Case | Agno | LangChain | CrewAI |
|----------|------|-----------|--------|
| Persistent memory | Best | Manual | Limited |
| Multi-agent teams | Good | Manual | Best |
| RAG applications | Good | Best | Limited |
| Production FastAPI | Built-in | Manual | Manual |
| Model flexibility | Excellent | Excellent | Good |
| Learning from interactions | Built-in | Manual | Manual |

## Integration with Travel-Suite

Agno could enhance the travel-suite project with:

1. **Intelligent Itinerary Agent** - Learns user preferences over time
2. **Support Bot** - RAG-powered FAQ with trip knowledge
3. **Multi-Agent Planning** - Researcher + Planner + Budgeter team
4. **Notification Agent** - Contextual, personalized messages
