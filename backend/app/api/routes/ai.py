"""AI routes — analyze voice, image, classify, translate"""
import json
import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from app.core.security import get_current_user
from app.core.config import get_settings
from app.services.ai_service import AIService

router = APIRouter()

ai_service = AIService()


class TextAnalysisRequest(BaseModel):
    text: str
    source_language: str | None = None


class TranslationRequest(BaseModel):
    text: str
    source_language: str | None = None
    target_language: str = "en"


@router.post("/analyze-text")
async def analyze_text(req: TextAnalysisRequest, user: dict = Depends(get_current_user)):
    """Analyze text: detect language, translate, classify emergency."""
    try:
        result = await ai_service.analyze_emergency_text(req.text, req.source_language)
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI analysis unavailable: {str(e)}")


@router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    context: str = Form(default=""),
    user: dict = Depends(get_current_user),
):
    """Analyze emergency image using AI vision."""
    try:
        contents = await file.read()
        image_base64 = base64.b64encode(contents).decode("utf-8")
        result = await ai_service.analyze_emergency_image(image_base64, file.content_type, context)
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Image analysis unavailable: {str(e)}")


@router.post("/translate")
async def translate(req: TranslationRequest, user: dict = Depends(get_current_user)):
    """Translate text between languages."""
    try:
        result = await ai_service.translate_text(req.text, req.source_language, req.target_language)
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Translation unavailable: {str(e)}")


@router.post("/classify")
async def classify(req: TextAnalysisRequest, user: dict = Depends(get_current_user)):
    """Classify emergency type and priority from text."""
    try:
        result = await ai_service.classify_emergency(req.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Classification unavailable: {str(e)}")
