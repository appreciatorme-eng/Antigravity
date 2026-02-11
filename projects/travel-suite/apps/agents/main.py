"""
GoBuddy AI Agents - FastAPI Server
Multi-agent travel assistance powered by Agno framework
"""
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Import agents
from agents.trip_planner import trip_planner_team
from agents.support_bot import support_agent
from agents.recommender import recommender_agent
from api.routes import router
from middleware import rate_limit_middleware

# Optional: Sentry integration for error tracking
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.httpx import HttpxIntegration

    SENTRY_DSN = os.getenv("SENTRY_DSN")
    if SENTRY_DSN:
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                FastApiIntegration(),
                HttpxIntegration(),
            ],
            traces_sample_rate=float(os.getenv("SENTRY_TRACE_SAMPLE_RATE", "0.1")),
            environment=os.getenv("ENV", "production"),
            attach_stacktrace=True,
        )
        logger.info("Sentry initialized for error tracking")
except ImportError:
    logger.warning("Sentry SDK not installed. Error tracking disabled.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Load knowledge base for RAG
    print("Loading knowledge base...")
    try:
        from agents.support_bot import load_knowledge
        await load_knowledge()
        print("Knowledge base loaded successfully")
    except Exception as e:
        print(f"Warning: Could not load knowledge base: {e}")

    yield

    # Shutdown
    print("Shutting down AI agents...")


# Create FastAPI app with OpenAPI documentation
app = FastAPI(
    title="GoBuddy AI Agents API",
    description="AI-powered travel assistance with multi-agent collaboration. Features include trip planning, support bot with RAG, and personalized recommendations.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Add rate limiting middleware
app.middleware("http")(rate_limit_middleware)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("WEB_APP_URL", "http://localhost:3000"),
        os.getenv("MOBILE_APP_URL", "exp://localhost:8081"),
        "http://localhost:3000",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed error information."""
    logger.warning(f"Validation error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "details": exc.errors(),
            "path": str(request.url.path),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if os.getenv("ENV") == "development" else "An error occurred",
            "path": str(request.url.path),
        },
    )


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": "GoBuddy AI Agents",
        "version": "1.0.0",
        "agents": [
            {"name": "TripPlanner", "endpoint": "/api/chat/trip-planner"},
            {"name": "SupportBot", "endpoint": "/api/chat/support"},
            {"name": "Recommender", "endpoint": "/api/chat/recommend"},
        ],
        "health": "/api/health",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agents": {
            "trip_planner": "ready",
            "support_bot": "ready",
            "recommender": "ready",
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=os.getenv("ENV", "development") == "development",
    )
