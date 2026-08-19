"""
JeevanSetu Backend — Security utilities
JWT verification, password hashing, role checking
"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import get_settings

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Verify Supabase JWT and extract user info."""
    settings = get_settings()
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            key=settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no subject",
            )
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("user_metadata", {}).get("role", "USER"),
            "token": token,
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )


def require_role(*roles: str):
    """Dependency that checks the user has one of the required roles."""
    async def role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {', '.join(roles)}",
            )
        return user
    return role_checker


require_user = require_role("USER", "MEDICAL_AFFILIATE", "ADMIN")
require_affiliate = require_role("MEDICAL_AFFILIATE", "ADMIN")
require_admin = require_role("ADMIN")
