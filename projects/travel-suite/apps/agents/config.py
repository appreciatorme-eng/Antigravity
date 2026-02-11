"""
Configuration module for GoBuddy AI Agents
Handles environment variables and application settings
"""
import os
from typing import Optional

# Server Configuration
PORT: int = int(os.getenv("PORT", "8001"))
ENV: str = os.getenv("ENV", "development")
DEBUG: bool = ENV == "development"

# API Keys
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")

# Database
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
DATABASE_URL: str = os.getenv("DATABASE_URL", "")

# CORS
WEB_APP_URL: str = os.getenv("WEB_APP_URL", "http://localhost:3000")
MOBILE_APP_URL: str = os.getenv("MOBILE_APP_URL", "exp://localhost:8081")

# Sentry Configuration
SENTRY_DSN: Optional[str] = os.getenv("SENTRY_DSN")
SENTRY_TRACE_SAMPLE_RATE: float = float(os.getenv("SENTRY_TRACE_SAMPLE_RATE", "0.1"))
SENTRY_ENABLED: bool = bool(SENTRY_DSN)

# Rate Limiting Configuration
RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
DEFAULT_RATE_LIMIT: int = int(os.getenv("DEFAULT_RATE_LIMIT", "100"))
RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

# Logging Configuration
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")  # json or text

# OpenAPI Configuration
OPENAPI_ENABLED: bool = ENV != "production" or os.getenv("OPENAPI_ENABLED", "false").lower() == "true"
OPENAPI_TITLE: str = "GoBuddy AI Agents API"
OPENAPI_DESCRIPTION: str = "AI-powered travel assistance with multi-agent collaboration"
OPENAPI_VERSION: str = "1.0.0"

# Validation
if not OPENAI_API_KEY and ENV == "production":
    raise ValueError("OPENAI_API_KEY is required in production")

if not SUPABASE_URL and ENV == "production":
    raise ValueError("SUPABASE_URL is required in production")
