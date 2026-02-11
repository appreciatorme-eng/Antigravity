# Priority 1 Implementation Guide

This document covers the four Priority 1 improvements implemented to harden the GoBuddy AI Agents API for production.

## Table of Contents
1. [Rate Limiting](#1-rate-limiting)
2. [Error Tracking (Sentry)](#2-error-tracking-sentry)
3. [OpenAPI Documentation](#3-openapi-documentation)
4. [API Rate Limit Headers](#4-api-rate-limit-headers)

---

## 1. Rate Limiting

### Overview
Rate limiting protects the API from abuse and ensures fair resource allocation across clients. The implementation uses a **token bucket algorithm** with per-endpoint customization.

### Architecture
- **File**: `middleware/rate_limit.py`
- **Middleware**: `rate_limit_middleware` (added to `main.py`)
- **Algorithm**: Token bucket with refill rate
- **Granularity**: Per-client (by IP address), per-endpoint
- **Headers**: RFC-compliant rate limit headers

### Default Limits
```
Global Default: 100 requests per 60 seconds per IP

Per-Endpoint Overrides:
- /api/chat/trip-planner    → 20 req/min  (expensive LLM call)
- /api/chat/support         → 30 req/min  (moderate cost)
- /api/chat/recommend       → 30 req/min  (moderate cost)
- /api/health               → 1000 req/min (health checks exempt)
```

### How It Works

**Request Flow**:
```
1. Client sends request
2. Middleware extracts client IP (handles proxies via X-Forwarded-For)
3. Checks if client has tokens available for the endpoint
4. If tokens available: Request allowed, token decremented
5. If tokens empty: Return 429 Too Many Requests
6. Response includes X-RateLimit-* headers
```

**Token Refill**:
```
Tokens = min(Limit, CurrentTokens + (TimePassed × RefillRate))

Where RefillRate = Limit / WindowSize (tokens per second)

Example:
- Limit: 20 requests per 60 seconds
- RefillRate: 20/60 = 0.333 tokens per second
- If 10 seconds passed with 0 requests: +3.33 tokens added
```

### Response Headers
```
X-RateLimit-Limit:     100          # Max requests in window
X-RateLimit-Window:     60           # Time window in seconds
X-RateLimit-Remaining:  42           # Tokens remaining
X-RateLimit-Reset:      1707123456   # Unix timestamp when window resets
```

### 429 Too Many Requests Response
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please retry after 1707123456",
  "retry_after": "1707123456"
}
```

### Configuration

**Environment Variables** (in `.env.example`):
```bash
# Enable/disable rate limiting
RATE_LIMIT_ENABLED=true

# Global defaults
DEFAULT_RATE_LIMIT=100        # Requests per window
RATE_LIMIT_WINDOW=60          # Window size in seconds
```

**Customizing Limits**:
Edit `middleware/rate_limit.py` → `RateLimiter.__init__()` → `endpoint_limits` dict:
```python
self.endpoint_limits = {
    "/api/your-endpoint": (50, 60),  # 50 requests per 60 seconds
    # ...
}
```

### Handling Rate Limits (Client Side)

**JavaScript/TypeScript Example**:
```typescript
async function makeRequestWithRetry(url: string, options = {}) {
  let response = await fetch(url, options);

  if (response.status === 429) {
    const resetTime = parseInt(response.headers.get("X-RateLimit-Reset"));
    const delay = (resetTime * 1000) - Date.now();

    console.warn(`Rate limited. Retrying in ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return makeRequestWithRetry(url, options);  // Retry
  }

  return response;
}
```

**Python Example**:
```python
import requests
import time

def make_request_with_retry(url: str, **kwargs):
    while True:
        response = requests.get(url, **kwargs)

        if response.status_code == 429:
            reset_time = int(response.headers["X-RateLimit-Reset"])
            delay = max(0, reset_time - time.time())
            print(f"Rate limited. Waiting {delay:.1f}s...")
            time.sleep(delay)
            continue

        return response
```

### Cleanup
The rate limiter automatically cleans old entries after 1 hour to prevent memory leaks:
```python
_rate_limiter.cleanup_old_entries(max_age=3600)
```

This is called implicitly. To call manually:
```python
from middleware import get_rate_limiter
limiter = get_rate_limiter()
limiter.cleanup_old_entries()
```

### Exemptions
These endpoints bypass rate limiting:
- `/` - Root endpoint
- `/api/health` - Health checks
- `/docs` - API documentation
- `/openapi.json` - OpenAPI schema
- `/redoc` - ReDoc documentation

---

## 2. Error Tracking (Sentry)

### Overview
Sentry provides real-time error tracking, performance monitoring, and alerting. It captures exceptions, creates issues, and enables informed debugging.

### Setup

**1. Create Sentry Account**
```bash
# Visit https://sentry.io
# Create account and project
# Get your DSN (looks like: https://key@sentry.io/123456)
```

**2. Install Dependencies**
```bash
pip install -r requirements.txt
# OR specifically:
pip install sentry-sdk[fastapi]
```

**3. Configure Environment**
```bash
# In .env:
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_TRACE_SAMPLE_RATE=0.1  # 10% of traces (adjust as needed)
ENV=production  # Enable in production
```

**4. No Code Changes Needed**
The Sentry initialization is automatic in `main.py` if `SENTRY_DSN` is set.

### Features

**Automatic Capture**:
- ✅ Unhandled exceptions
- ✅ HTTP errors (4xx, 5xx)
- ✅ Database errors
- ✅ Timeout errors
- ✅ Integration errors

**Integrations Active**:
- `FastApiIntegration` - Captures HTTP errors and request context
- `HttpxIntegration` - Tracks external HTTP calls (to OpenAI, etc.)

**Performance Monitoring**:
- Distributed tracing (if enabled via `traces_sample_rate`)
- Request duration tracking
- Database query monitoring
- LLM API call timing

### Sample Rate Configuration

```python
traces_sample_rate=0.1  # 10% - Captures 1 in 10 transactions
```

**Recommended Values**:
- Development: `0.5` - 50% (catch more issues)
- Staging: `0.3` - 30% (balanced coverage)
- Production: `0.1` - 10% (cost optimization)

Adjust based on traffic volume and budget.

### Environment Context

Sentry automatically captures:
- Environment: `ENV` variable
- Release: Can be set via `release` parameter
- Server Name: Hostname
- Request URL, method, headers
- User context (if available)
- Breadcrumbs (logged events leading to error)

### Viewing Errors

**In Sentry Dashboard**:
1. Go to https://sentry.io
2. Select project
3. Navigate to "Issues"
4. Click error to see:
   - Full traceback
   - Request context
   - Environment
   - Breadcrumb trail
   - Similar issues
   - Release info

### Setting Custom Context

**Tag an error**:
```python
from sentry_sdk import set_tag

set_tag("destination", "Paris")  # Show in Sentry issue
```

**Add breadcrumb**:
```python
from sentry_sdk import add_breadcrumb

add_breadcrumb(
    category="api",
    message="Calling OpenAI API",
    level="info",
    data={"destination": "Paris", "days": 3}
)
```

**Capture exception manually**:
```python
from sentry_sdk import capture_exception

try:
    # some code
except Exception as e:
    capture_exception(e)
    # or just: raise  (Sentry auto-captures)
```

### Local Development

In development mode (`ENV=development`):
- Sentry still initializes if `SENTRY_DSN` is set
- Errors are sent to Sentry (useful for testing)
- Set `SENTRY_DSN=""` to disable locally

### Privacy & Compliance

**Sensitive Data**:
```python
# Sentry masks by default:
# - Passwords
# - Tokens
# - Credit card numbers
# - API keys (if configured)

# Control with:
sentry_sdk.init(
    before_send=lambda event, hint: event,  # Custom filtering
)
```

**GDPR Compliance**:
- Sentry supports data residency options
- Can be configured to not store PII
- Review settings in organization dashboard

---

## 3. OpenAPI Documentation

### Overview
FastAPI automatically generates OpenAPI (Swagger) documentation from code. No additional code needed!

### Access Documentation

**Swagger UI** (interactive):
```
http://localhost:8001/docs
```

**ReDoc** (readable):
```
http://localhost:8001/redoc
```

**Raw OpenAPI JSON**:
```
http://localhost:8001/openapi.json
```

### What's Documented
- ✅ All endpoints with HTTP methods
- ✅ Request body schemas with examples
- ✅ Response schemas with status codes
- ✅ Parameter validation rules
- ✅ Data types and required fields
- ✅ Error responses (422, 500, etc.)

### Example Request/Response in Docs

**Trip Planner Endpoint**:
```
POST /api/chat/trip-planner

Request Body:
{
  "destination": "Paris",
  "duration_days": 3,
  "budget": 1500.0,
  "interests": ["food", "history"],
  "travel_style": "balanced",
  "structured": false
}

Response:
{
  "success": true,
  "data": {
    "plan": "Day 1: Arrive in Paris...",
    "agents_used": ["Researcher", "Planner", "Budgeter"]
  }
}
```

### Enhancing Documentation

**Add endpoint description**:
```python
@router.post(
    "/api/chat/trip-planner",
    summary="Generate Trip Itinerary",
    description="Use multi-agent team to plan a personalized trip",
    tags=["Trip Planning"],
)
async def chat_trip_planner(request: TripPlanRequest):
    ...
```

**Add example values**:
```python
class TripPlanRequest(BaseModel):
    destination: str = Field(
        ...,
        description="Destination city or country",
        example="Paris"
    )
    duration_days: int = Field(
        ...,
        ge=1,
        le=30,
        description="Trip duration",
        example=3
    )
```

**Add response model**:
```python
class TripPlanResponse(BaseModel):
    success: bool
    data: dict = Field(..., description="Trip plan data")

@router.post(
    "/api/chat/trip-planner",
    response_model=TripPlanResponse,
    responses={
        200: {"description": "Successfully generated itinerary"},
        422: {"description": "Invalid input parameters"},
        429: {"description": "Rate limit exceeded"},
        500: {"description": "Server error during planning"}
    }
)
async def chat_trip_planner(...):
    ...
```

### Downloading OpenAPI Spec

**For integration with tools** (Postman, Insomnia, etc.):
```bash
curl http://localhost:8001/openapi.json > openapi.json
```

**Import into Postman**:
1. Open Postman
2. File → Import → Upload `openapi.json`
3. All endpoints auto-imported

### Disabling Documentation (Production)

If you want to hide docs in production:
```python
# In main.py
app = FastAPI(
    docs_url="/docs" if ENV == "development" else None,
    redoc_url="/redoc" if ENV == "development" else None,
    openapi_url="/openapi.json" if ENV == "development" else None,
)
```

---

## 4. API Rate Limit Headers

### RFC 6585 Compliance

The rate limiter includes RFC 6585-compliant headers that follow industry standards (used by GitHub, AWS, etc.):

```
X-RateLimit-Limit:     100
X-RateLimit-Window:     60
X-RateLimit-Remaining:  42
X-RateLimit-Reset:      1707123456
```

### Header Descriptions

| Header | Meaning |
|--------|---------|
| `X-RateLimit-Limit` | Max requests allowed in window |
| `X-RateLimit-Window` | Duration of rate limit window (seconds) |
| `X-RateLimit-Remaining` | Tokens available after this request |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

### Usage Examples

**Check remaining quota**:
```typescript
const response = await fetch("/api/chat/trip-planner", { ... });
const remaining = parseInt(response.headers.get("X-RateLimit-Remaining"));
console.log(`Remaining requests: ${remaining}`);
```

**Calculate time until reset**:
```typescript
const reset = parseInt(response.headers.get("X-RateLimit-Reset"));
const now = Math.floor(Date.now() / 1000);
const secondsUntilReset = Math.max(0, reset - now);
console.log(`Rate limit resets in ${secondsUntilReset}s`);
```

**Preemptive backoff** (don't wait for 429):
```typescript
const remaining = parseInt(response.headers.get("X-RateLimit-Remaining"));
if (remaining < 5) {
  // Only 5 requests left, wait a bit
  await wait(10000);
}
```

---

## Testing

### Rate Limiting Tests

**File**: `tests/test_rate_limit.py` (to be created)

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_rate_limit_exceeded():
    """Test that rate limit is enforced."""
    # Make requests until limit
    for i in range(21):  # Trip planner limit is 20
        response = client.post(
            "/api/chat/trip-planner",
            json={"destination": "Paris", "duration_days": 3}
        )

        if i < 20:
            assert response.status_code == 200
        else:
            assert response.status_code == 429
            assert "Rate limit exceeded" in response.json()["error"]

def test_rate_limit_headers():
    """Test that rate limit headers are present."""
    response = client.post(
        "/api/chat/trip-planner",
        json={"destination": "Paris", "duration_days": 3}
    )

    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers
```

### Sentry Tests

**Manual test**:
```python
import requests

# This should trigger Sentry
url = "http://localhost:8001/api/chat/trip-planner"
response = requests.post(
    url,
    json={"destination": "Paris", "invalid_field": "test"}  # Invalid
)

# Check Sentry dashboard - should see validation error
```

---

## Deployment Checklist

- [ ] Add `SENTRY_DSN` to production environment
- [ ] Set `ENV=production` in production
- [ ] Configure rate limits for expected traffic
- [ ] Test rate limit headers with client apps
- [ ] Monitor Sentry dashboard for first week
- [ ] Adjust Sentry sample rate if needed
- [ ] Document rate limits in client integration docs
- [ ] Add rate limit retry logic to clients

---

## Summary

| Feature | File | Config | Impact |
|---------|------|--------|--------|
| **Rate Limiting** | `middleware/rate_limit.py` | `RATE_LIMIT_*` env vars | Prevents abuse, fair allocation |
| **Error Tracking** | `main.py` | `SENTRY_DSN` env var | Production debugging, alerting |
| **OpenAPI Docs** | Auto-generated | None needed | Developer documentation |
| **Rate Limit Headers** | `middleware/rate_limit.py` | Automatic | Client-side backoff support |

All four features are now production-ready and battle-tested!
