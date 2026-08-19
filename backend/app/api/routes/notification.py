"""Notification routes"""
from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.core.database import get_supabase_admin_client

router = APIRouter()


@router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    """List notifications for current user."""
    db = get_supabase_admin_client()
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        return []
    result = db.table("notifications").select("*").eq("user_id", profile.data[0]["id"]).order("created_at", desc=True).limit(50).execute()
    return result.data or []


@router.put("/{notification_id}/read")
async def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark notification as read."""
    db = get_supabase_admin_client()
    db.table("notifications").update({"read": True}).eq("id", notification_id).execute()
    return {"success": True}


@router.get("/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    """Get unread notification count."""
    db = get_supabase_admin_client()
    profile = db.table("profiles").select("id").eq("auth_user_id", user["user_id"]).execute()
    if not profile.data:
        return {"count": 0}
    result = db.table("notifications").select("id", count="exact").eq("user_id", profile.data[0]["id"]).eq("read", False).execute()
    return {"count": result.count or 0}
