"""Consent routes — request, approve, deny, revoke, list"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user, require_affiliate
from app.core.database import get_supabase_admin_client

router = APIRouter()


class ConsentRequest(BaseModel):
    incident_id: str
    user_id: str  # Target user profile ID
    requested_fields: list[str]  # e.g. ["blood_group", "allergy"]
    purpose: str
    access_duration_minutes: int = 30


class ConsentResponse(BaseModel):
    status: str  # APPROVED or DENIED


@router.post("/request")
async def request_consent(data: ConsentRequest, user: dict = Depends(require_affiliate)):
    """Affiliate requests consent to access user's medical credentials."""
    db = get_supabase_admin_client()
    
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Requester profile not found")
    
    result = db.table("consents").insert({
        "incident_id": data.incident_id,
        "requester_id": profile.data[0]["id"],
        "user_id": data.user_id,
        "requested_fields": data.requested_fields,
        "purpose": data.purpose,
        "status": "PENDING",
        "access_duration_minutes": data.access_duration_minutes,
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create consent request")
    
    consent = result.data[0]
    
    # Create notification for the user
    db.table("notifications").insert({
        "user_id": data.user_id,
        "title": "Medical Information Request",
        "message": f"A medical affiliate has requested access to: {', '.join(data.requested_fields)}",
        "type": "CONSENT_REQUEST",
        "priority": "HIGH",
        "data": {"consent_id": consent["id"], "incident_id": data.incident_id},
    }).execute()
    
    # Audit
    db.table("audit_logs").insert({
        "actor_id": profile.data[0]["id"],
        "actor_role": user["role"],
        "incident_id": data.incident_id,
        "action": "CONSENT_REQUESTED",
        "resource_type": "consent",
        "resource_id": consent["id"],
        "metadata": {"requested_fields": data.requested_fields, "purpose": data.purpose},
    }).execute()
    
    return consent


@router.put("/{consent_id}/respond")
async def respond_to_consent(consent_id: str, data: ConsentResponse, user: dict = Depends(get_current_user)):
    """User approves or denies a consent request."""
    if data.status not in ("APPROVED", "DENIED"):
        raise HTTPException(status_code=400, detail="Status must be APPROVED or DENIED")
    
    db = get_supabase_admin_client()
    
    # Verify consent exists and belongs to user
    consent = db.table("consents").select("*").eq("id", consent_id).execute()
    if not consent.data:
        raise HTTPException(status_code=404, detail="Consent request not found")
    
    consent_data = consent.data[0]
    
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data or profile.data[0]["id"] != consent_data["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to respond to this consent")
    
    update = {"status": data.status}
    if data.status == "APPROVED":
        now = datetime.now(timezone.utc)
        duration = consent_data.get("access_duration_minutes", 30)
        update["approved_at"] = now.isoformat()
        update["expires_at"] = (now + timedelta(minutes=duration)).isoformat()
    
    db.table("consents").update(update).eq("id", consent_id).execute()
    
    # Audit
    db.table("audit_logs").insert({
        "actor_id": profile.data[0]["id"],
        "actor_role": user["role"],
        "incident_id": consent_data.get("incident_id"),
        "action": f"CONSENT_{data.status}",
        "resource_type": "consent",
        "resource_id": consent_id,
    }).execute()
    
    return {"success": True, "status": data.status}


@router.post("/{consent_id}/revoke")
async def revoke_consent(consent_id: str, user: dict = Depends(get_current_user)):
    """Revoke a previously approved consent."""
    db = get_supabase_admin_client()
    
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    consent = db.table("consents").select("*").eq("id", consent_id).eq("user_id", profile.data[0]["id"]).execute()
    if not consent.data:
        raise HTTPException(status_code=404, detail="Consent not found")
    
    db.table("consents").update({
        "status": "REVOKED",
        "revoked_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", consent_id).execute()
    
    # Audit
    db.table("audit_logs").insert({
        "actor_id": profile.data[0]["id"],
        "actor_role": user["role"],
        "incident_id": consent.data[0].get("incident_id"),
        "action": "CONSENT_REVOKED",
        "resource_type": "consent",
        "resource_id": consent_id,
    }).execute()
    
    return {"success": True, "status": "REVOKED"}


@router.get("")
async def list_consents(user: dict = Depends(get_current_user)):
    """List consent requests for the current user."""
    db = get_supabase_admin_client()
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        return []
    
    pid = profile.data[0]["id"]
    
    if user["role"] == "MEDICAL_AFFILIATE":
        result = db.table("consents").select("*").eq("requester_id", pid).order("created_at", desc=True).execute()
    else:
        result = db.table("consents").select("*").eq("user_id", pid).order("created_at", desc=True).execute()
    
    return result.data or []
