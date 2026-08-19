"""Auth routes — verify token, set role, profile management"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.core.security import get_current_user
from app.core.database import get_supabase_admin_client

router = APIRouter()


class SetRoleRequest(BaseModel):
    role: str  # USER or MEDICAL_AFFILIATE


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    preferred_language: str | None = None


class AffiliateRegistration(BaseModel):
    organization_name: str
    hospital_name: str
    license_number: str
    official_email: str
    phone: str
    address: str
    city: str
    state: str
    org_type: str


@router.post("/verify-token")
async def verify_token(user: dict = Depends(get_current_user)):
    """Verify JWT and return user info."""
    return {"valid": True, "user_id": user["user_id"], "email": user["email"], "role": user["role"]}


@router.post("/set-role")
async def set_role(req: SetRoleRequest, user: dict = Depends(get_current_user)):
    """Set user role after signup. Cannot set ADMIN role."""
    if req.role not in ("USER", "MEDICAL_AFFILIATE"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be USER or MEDICAL_AFFILIATE")
    
    db = get_supabase_admin_client()
    
    # Check if profile exists
    existing = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    
    if existing.data:
        # Update role
        db.table("profiles").update({"role": req.role}).eq("auth_user_id", user["user_id"]).execute()
    else:
        # Create profile
        db.table("profiles").insert({
            "auth_user_id": user["user_id"],
            "email": user["email"],
            "role": req.role,
        }).execute()
    
    return {"success": True, "role": req.role}


@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """Get current user profile."""
    db = get_supabase_admin_client()
    result = db.table("profiles").select("*").eq("auth_user_id", user["user_id"]).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return result.data[0]


@router.put("/profile")
async def update_profile(update: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Update current user profile."""
    db = get_supabase_admin_client()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("profiles").update(update_data).eq("auth_user_id", user["user_id"]).execute()
    return result.data[0] if result.data else {"success": True}


@router.post("/affiliate-register")
async def register_affiliate(reg: AffiliateRegistration, user: dict = Depends(get_current_user)):
    """Register as medical affiliate with organization info."""
    db = get_supabase_admin_client()
    
    # Create organization
    org = db.table("organizations").insert({
        "name": reg.organization_name,
        "hospital_name": reg.hospital_name,
        "license_number": reg.license_number,
        "official_email": reg.official_email,
        "phone": reg.phone,
        "address": reg.address,
        "city": reg.city,
        "state": reg.state,
        "org_type": reg.org_type,
        "verification_status": "PENDING",
    }).execute()
    
    if not org.data:
        raise HTTPException(status_code=500, detail="Failed to create organization")
    
    org_id = org.data[0]["id"]
    
    # Get profile
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Create affiliate record
    db.table("medical_affiliates").insert({
        "profile_id": profile.data[0]["id"],
        "organization_id": org_id,
        "status": "ACTIVE",
    }).execute()
    
    return {"success": True, "organization_id": org_id, "status": "PENDING"}
