"""Credential routes — CRUD, verify, QR"""
import json
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.database import get_supabase_admin_client
from app.services.credential_service import CredentialService

router = APIRouter()
credential_svc = CredentialService()


class CredentialCreate(BaseModel):
    credential_type: str  # IDENTITY, BLOOD_GROUP, ALLERGY, EMERGENCY_CONTACT, INSURANCE
    credential_data: dict
    expires_in_days: int = 365


@router.get("")
async def list_credentials(user: dict = Depends(get_current_user)):
    """List user's credentials."""
    db = get_supabase_admin_client()
    profile = db.table("profiles").select("id, did_identifier").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        return []
    result = db.table("credentials").select("*").eq("user_id", profile.data[0]["id"]).order("created_at", desc=True).execute()
    return result.data or []


@router.post("")
async def create_credential(data: CredentialCreate, user: dict = Depends(get_current_user)):
    """Issue a new credential for the user."""
    db = get_supabase_admin_client()
    profile = db.table("profiles").select("id, did_identifier").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile_data = profile.data[0]
    did_subject = profile_data.get("did_identifier") or f"did:jeevansetu:user:{profile_data['id'][:8]}"
    
    # Build W3C-style credential
    vc = credential_svc.create_verifiable_credential(
        credential_type=data.credential_type,
        subject_did=did_subject,
        credential_data=data.credential_data,
        expires_in_days=data.expires_in_days,
    )
    
    result = db.table("credentials").insert({
        "user_id": profile_data["id"],
        "credential_type": data.credential_type,
        "did_subject": did_subject,
        "did_issuer": vc["issuer"],
        "credential_data": data.credential_data,
        "proof": vc.get("proof", {}),
        "status": "ACTIVE",
        "issued_at": vc["issuanceDate"],
        "expires_at": vc.get("expirationDate"),
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create credential")
    
    # Audit
    db.table("audit_logs").insert({
        "actor_id": profile_data["id"],
        "actor_role": user["role"],
        "action": "CREDENTIAL_CREATED",
        "resource_type": "credential",
        "resource_id": result.data[0]["id"],
        "metadata": {"type": data.credential_type},
    }).execute()
    
    return {**result.data[0], "verifiable_credential": vc}


@router.post("/verify")
async def verify_credential(credential_id: str, user: dict = Depends(get_current_user)):
    """Verify a credential's signature and validity."""
    db = get_supabase_admin_client()
    result = db.table("credentials").select("*").eq("id", credential_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    cred = result.data[0]
    verification = credential_svc.verify_credential(cred)
    
    # Audit
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if profile.data:
        db.table("audit_logs").insert({
            "actor_id": profile.data[0]["id"],
            "actor_role": user["role"],
            "action": "CREDENTIAL_VERIFIED",
            "resource_type": "credential",
            "resource_id": credential_id,
            "metadata": {"verified": verification["verified"]},
        }).execute()
    
    return verification


@router.get("/qr/{credential_id}")
async def get_credential_qr(credential_id: str, user: dict = Depends(get_current_user)):
    """Generate QR data for credential sharing (secure reference, not plaintext)."""
    db = get_supabase_admin_client()
    result = db.table("credentials").select("id, credential_type, did_subject, did_issuer, proof, status").eq("id", credential_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    cred = result.data[0]
    # QR contains a verification reference, not the actual data
    qr_data = {
        "type": "JeevanSetuCredentialRef",
        "credential_id": cred["id"],
        "credential_type": cred["credential_type"],
        "subject": cred["did_subject"],
        "issuer": cred["did_issuer"],
        "verification_hash": hashlib.sha256(json.dumps(cred.get("proof", {}), sort_keys=True).encode()).hexdigest()[:16],
    }
    
    return qr_data
