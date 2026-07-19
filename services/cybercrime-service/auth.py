# =============================================================
#  Kanad S.H.I.E.L.D. — Auth Utilities (cybercrime-service)
#  JWT verification using the same secret as the SOS service.
#  Both services share JWT_SECRET so a token issued by SOS service
#  is valid on the cybercrime service — single sign-on.
# =============================================================

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
ALGORITHM  = "HS256"

bearer_scheme = HTTPBearer()


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    """
    FastAPI dependency — verifies JWT Bearer token.
    Returns the decoded payload dict.
    Raises 401 if token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_officer(payload: dict = Depends(verify_token)) -> dict:
    """
    FastAPI dependency — requires role in ['officer', 'supervisor', 'admin'].
    Must be composed after verify_token.
    """
    allowed = {"officer", "supervisor", "admin"}
    if payload.get("role") not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is restricted to police officers.",
        )
    return payload
