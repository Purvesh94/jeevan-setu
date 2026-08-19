"""Emergency routes — create, get, update, list emergencies"""
import uuid
import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from app.core.security import get_current_user, require_affiliate
from app.core.database import get_supabase_admin_client

router = APIRouter()


def generate_incident_code() -> str:
    return f"JS-{''.join(random.choices(string.digits, k=6))}"


class EmergencyCreate(BaseModel):
    category: str | None = None
    priority: str | None = None
    description: str | None = None
    transcript: str | None = None
    translation: str | None = None
    language: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    location_accuracy: float | None = None
    address_text: str | None = None
    ai_confidence: float | None = None
    ai_raw_result: dict | None = None
    required_services: list[str] | None = None
    recommended_hospital_id: str | None = None


class StatusUpdate(BaseModel):
    status: str
    notes: str | None = None


@router.post("")
async def create_emergency(data: EmergencyCreate, user: dict = Depends(get_current_user)):
    """Create a new emergency incident."""
    db = get_supabase_admin_client()
    
    # Get profile
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found. Complete registration first.")
    
    incident = {
        "incident_code": generate_incident_code(),
        "user_id": profile.data[0]["id"],
        "category": data.category or "OTHER",
        "priority": data.priority or "UNKNOWN",
        "description": data.description or "",
        "transcript": data.transcript,
        "translation": data.translation,
        "language": data.language or "en",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "location_accuracy": data.location_accuracy,
        "address_text": data.address_text,
        "ai_confidence": data.ai_confidence,
        "ai_raw_result": data.ai_raw_result,
        "required_services": data.required_services,
        "recommended_hospital_id": data.recommended_hospital_id,
        "status": "NEW",
    }
    
    result = db.table("emergency_incidents").insert(incident).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create emergency")
    
    incident_data = result.data[0]
    
    # Log to audit
    db.table("audit_logs").insert({
        "actor_id": profile.data[0]["id"],
        "actor_role": user["role"],
        "incident_id": incident_data["id"],
        "action": "EMERGENCY_CREATED",
        "resource_type": "emergency_incident",
        "resource_id": incident_data["id"],
        "metadata": {"category": data.category, "priority": data.priority},
    }).execute()
    
    return incident_data


@router.get("/{incident_id}")
async def get_emergency(incident_id: str, user: dict = Depends(get_current_user)):
    """Get emergency incident by ID."""
    db = get_supabase_admin_client()
    result = db.table("emergency_incidents").select("*").eq("id", incident_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Emergency not found")
    
    return result.data[0]


@router.get("")
async def list_emergencies(user: dict = Depends(get_current_user)):
    """List user's emergencies (or all for affiliates/admins)."""
    db = get_supabase_admin_client()
    
    if user["role"] == "ADMIN":
        result = db.table("emergency_incidents").select("*").order("created_at", desc=True).execute()
    elif user["role"] == "MEDICAL_AFFILIATE":
        result = db.table("emergency_incidents").select("*").order("created_at", desc=True).execute()
    else:
        profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
        if not profile.data:
            return []
        result = db.table("emergency_incidents").select("*").eq("user_id", profile.data[0]["id"]).order("created_at", desc=True).execute()
    
    return result.data or []


@router.get("/active/list")
async def list_active_emergencies(user: dict = Depends(require_affiliate)):
    """List active emergencies for affiliates."""
    db = get_supabase_admin_client()
    result = (
        db.table("emergency_incidents")
        .select("*")
        .in_("status", ["NEW", "ACCEPTED", "IN_TRANSIT", "REACHED", "TREATMENT_STARTED"])
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.put("/{incident_id}/status")
async def update_status(
    incident_id: str, data: StatusUpdate, user: dict = Depends(get_current_user)
):
    """Update emergency status."""
    valid_statuses = ["NEW", "ACCEPTED", "IN_TRANSIT", "REACHED", "TREATMENT_STARTED", "CLOSED"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    db = get_supabase_admin_client()
    
    # Get current incident
    current = db.table("emergency_incidents").select("*").eq("id", incident_id).execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Emergency not found")
    
    old_status = current.data[0]["status"]
    
    # Update status
    db.table("emergency_incidents").update({"status": data.status}).eq("id", incident_id).execute()
    
    # Get profile for audit
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    actor_id = profile.data[0]["id"] if profile.data else None
    
    # Create status history
    db.table("emergency_status_history").insert({
        "incident_id": incident_id,
        "old_status": old_status,
        "new_status": data.status,
        "changed_by": actor_id,
        "notes": data.notes,
    }).execute()
    
    # Audit log
    db.table("audit_logs").insert({
        "actor_id": actor_id,
        "actor_role": user["role"],
        "incident_id": incident_id,
        "action": "STATUS_CHANGED",
        "resource_type": "emergency_incident",
        "resource_id": incident_id,
        "metadata": {"old_status": old_status, "new_status": data.status, "notes": data.notes},
    }).execute()
    
    return {"success": True, "old_status": old_status, "new_status": data.status}
