"""
Authentication middleware for GoBuddy AI Agents.
Verifies Supabase JWT tokens on incoming requests.
"""
import os
import logging
from typing import Optional

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import httpx

logger = logging.getLogger("gobuddy.auth")

security = HTTPBearer(auto_error=False)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
ALLOW_DEV_AUTH_BYPASS = os.getenv("ALLOW_DEV_AUTH_BYPASS", "").lower() in {"1", "true", "yes"}


async def verify_supabase_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Verify a Supabase JWT token by calling the Supabase Auth API.

    Returns the authenticated user's metadata dict.
    Raises HTTPException 401 if the token is invalid or missing.
    """
    if not credentials:
        if ALLOW_DEV_AUTH_BYPASS and (not SUPABASE_URL or not SUPABASE_ANON_KEY):
            logger.warning(
                "Missing auth header with ALLOW_DEV_AUTH_BYPASS enabled; "
                "accepting dev identity for local/test workflows."
            )
            return {"sub": "dev-user", "email": "dev@localhost", "role": "authenticated"}
        raise HTTPException(status_code=401, detail="Missing authorization header")

    token = credentials.credentials

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        if ALLOW_DEV_AUTH_BYPASS:
            logger.warning(
                "Supabase auth env missing and ALLOW_DEV_AUTH_BYPASS enabled; "
                "accepting dev token for non-production workflows."
            )
            return {"sub": "dev-user", "email": "dev@localhost", "role": "authenticated"}
        raise HTTPException(
            status_code=503,
            detail="Authentication provider is not configured",
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": SUPABASE_ANON_KEY,
                },
                timeout=10.0,
            )

        if response.status_code != 200:
            logger.warning("Token verification failed: %s", response.text)
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_data = response.json()
        logger.info("Authenticated user: %s", user_data.get("id", "unknown"))
        return user_data

    except httpx.RequestError as e:
        logger.error("Auth service unreachable: %s", str(e))
        raise HTTPException(status_code=503, detail="Authentication service unavailable")


def get_user_id(user: dict = Depends(verify_supabase_token)) -> str:
    """Extract user ID from the verified token payload."""
    return user.get("id") or user.get("sub", "anonymous")
