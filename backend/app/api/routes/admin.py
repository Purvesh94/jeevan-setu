"""Admin routes — user management, affiliate verification, stats"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import require_admin
from app.core.database import get_supabase_admin_client

router = APIRouter()


class VerifyAffiliateRequest(BaseModel):
    status: str  # VERIFIED, REJECTED, SUSPENDED


@router.get("/users")
async def list_users(user: dict = Depends(require_admin)):
    """List all users."""
    db = get_supabase_admin_client()
    result = db.table("profiles").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.get("/affiliates")
async def list_affiliates(user: dict = Depends(require_admin)):
    """List all medical affiliates with their organizations."""
    db = get_supabase_admin_client()
    result = db.table("medical_affiliates").select("*, profiles(*), organizations(*)").order("created_at", desc=True).execute()
    return result.data or []


@router.put("/affiliates/{org_id}/verify")
async def verify_affiliate(org_id: str, data: VerifyAffiliateRequest, user: dict = Depends(require_admin)):
    """Verify, reject, or suspend an affiliate organization."""
    if data.status not in ("VERIFIED", "REJECTED", "SUSPENDED"):
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db = get_supabase_admin_client()
    
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    
    db.table("organizations").update({
        "verification_status": data.status,
        "verified_by": profile.data[0]["id"] if profile.data else None,
    }).eq("id", org_id).execute()
    
    return {"success": True, "status": data.status}


@router.get("/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    """Get admin dashboard statistics."""
    db = get_supabase_admin_client()
    
    users = db.table("profiles").select("id", count="exact").execute()
    emergencies = db.table("emergency_incidents").select("id", count="exact").execute()
    active = db.table("emergency_incidents").select("id", count="exact").in_("status", ["NEW", "ACCEPTED", "IN_TRANSIT"]).execute()
    affiliates = db.table("organizations").select("id", count="exact").execute()
    pending = db.table("organizations").select("id", count="exact").eq("verification_status", "PENDING").execute()
    
    return {
        "total_users": users.count or 0,
        "total_emergencies": emergencies.count or 0,
        "active_emergencies": active.count or 0,
        "total_affiliates": affiliates.count or 0,
        "pending_affiliates": pending.count or 0,
    }
