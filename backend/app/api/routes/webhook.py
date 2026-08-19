"""Webhook routes — n8n integration"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from app.core.config import get_settings

router = APIRouter()


class WebhookPayload(BaseModel):
    event: str
    data: dict


@router.post("/n8n")
async def n8n_webhook(
    payload: WebhookPayload,
    x_webhook_secret: str | None = Header(default=None),
):
    """Receive n8n webhook. Protected by shared secret."""
    settings = get_settings()
    if settings.N8N_WEBHOOK_SECRET and x_webhook_secret != settings.N8N_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
    
    # Process webhook event
    return {"received": True, "event": payload.event}
