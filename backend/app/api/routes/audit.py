"""Audit log routes"""
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, require_affiliate
from app.core.database import get_supabase_admin_client

router = APIRouter()


@router.get("")
async def list_audit_logs(
    incident_id: str | None = None,
    action: str | None = None,
    limit: int = Query(default=100, le=500),
    user: dict = Depends(require_affiliate),
):
    """List audit logs (affiliate/admin only)."""
    db = get_supabase_admin_client()
    query = db.table("audit_logs").select("*").order("created_at", desc=True).limit(limit)
    
    if incident_id:
        query = query.eq("incident_id", incident_id)
    if action:
        query = query.eq("action", action)
    
    result = query.execute()
    return result.data or []
