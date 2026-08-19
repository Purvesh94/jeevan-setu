"""
AI Service — Gemini-based emergency analysis
Handles: language detection, translation, classification, image analysis
Falls back gracefully when AI is unavailable.
"""
import json
import logging
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AIService:
    """Service abstracting AI operations via Google Gemini."""
    
    def __init__(self):
        self._model = None
        self._vision_model = None
    
    def _get_model(self):
        if self._model is None:
            try:
                import google.generativeai as genai
                settings = get_settings()
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {e}")
                raise RuntimeError("AI service unavailable")
        return self._model
    
    def _get_vision_model(self):
        if self._vision_model is None:
            try:
                import google.generativeai as genai
                settings = get_settings()
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self._vision_model = genai.GenerativeModel("gemini-2.0-flash")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Vision: {e}")
                raise RuntimeError("AI vision service unavailable")
        return self._vision_model
    
    async def analyze_emergency_text(self, text: str, source_language: str | None = None) -> dict:
        """Analyze emergency text: detect language, translate, classify."""
        model = self._get_model()
        
        prompt = f"""You are an emergency response AI assistant for JeevanSetu platform.
Analyze the following emergency message and respond ONLY with valid JSON (no markdown, no code blocks).

Emergency message: "{text}"

Respond with this exact JSON structure:
{{
  "detected_language": "language code (e.g., hi, en, mr)",
  "detected_language_name": "language name (e.g., Hindi, English, Marathi)",
  "original_text": "the original text",
  "translation": "English translation of the text (if already English, keep as is)",
  "category": "one of: MEDICAL, ROAD_ACCIDENT, FIRE, CRIME, WOMEN_SAFETY, CHILD_SAFETY, MISSING_PERSON, FLOOD, DISASTER, OTHER",
  "priority": "one of: CRITICAL, HIGH, MEDIUM, LOW",
  "summary": "Brief 1-2 sentence English summary of the emergency",
  "required_services": ["list of required services like AMBULANCE, FIRE_BRIGADE, POLICE, TRAUMA_TEAM"],
  "key_details": ["list of important details extracted"],
  "confidence": 0.85
}}

IMPORTANT:
- Do NOT diagnose medical conditions
- Do NOT prescribe treatment
- Focus on factual observations
- Classify based on described situation
- CRITICAL = life-threatening, unconscious, severe bleeding, not breathing
- HIGH = serious injury, breathing difficulty, severe pain
- MEDIUM = moderate injury, stable condition
- LOW = minor injury, non-urgent"""

        try:
            response = model.generate_content(prompt)
            text_response = response.text.strip()
            # Clean any markdown code block markers
            if text_response.startswith("```"):
                text_response = text_response.split("\n", 1)[1]
            if text_response.endswith("```"):
                text_response = text_response.rsplit("```", 1)[0]
            text_response = text_response.strip()
            return json.loads(text_response)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e}")
            return self._fallback_analysis(text)
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return self._fallback_analysis(text)
    
    async def analyze_emergency_image(self, image_base64: str, mime_type: str, context: str = "") -> dict:
        """Analyze an emergency image using Gemini vision."""
        import google.generativeai as genai
        
        model = self._get_vision_model()
        
        prompt = f"""You are an emergency response AI for JeevanSetu.
Analyze this image for emergency context. {f"Additional context: {context}" if context else ""}

Respond ONLY with valid JSON:
{{
  "scene_description": "What is visible in the image",
  "emergency_indicators": ["list of emergency-relevant observations"],
  "suggested_category": "MEDICAL, ROAD_ACCIDENT, FIRE, CRIME, DISASTER, or OTHER",
  "severity_assessment": "description of apparent severity",
  "confidence": 0.7
}}

IMPORTANT: 
- Only describe what you can observe
- Do NOT diagnose injuries
- Do NOT claim certainty about conditions you cannot verify"""

        try:
            image_part = {
                "mime_type": mime_type or "image/jpeg",
                "data": image_base64,
            }
            response = model.generate_content([prompt, image_part])
            text_response = response.text.strip()
            if text_response.startswith("```"):
                text_response = text_response.split("\n", 1)[1]
            if text_response.endswith("```"):
                text_response = text_response.rsplit("```", 1)[0]
            return json.loads(text_response.strip())
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "scene_description": "Image analysis unavailable",
                "emergency_indicators": [],
                "suggested_category": "OTHER",
                "severity_assessment": "Unable to assess from image",
                "confidence": 0.0,
                "error": str(e),
            }
    
    async def translate_text(self, text: str, source_lang: str | None, target_lang: str = "en") -> dict:
        """Translate text between languages."""
        model = self._get_model()
        prompt = f"""Translate the following text to {target_lang}. 
{f"Source language: {source_lang}" if source_lang else "Detect the source language."}

Text: "{text}"

Respond ONLY with valid JSON:
{{
  "source_language": "detected source language code",
  "target_language": "{target_lang}",
  "original_text": "original text",
  "translated_text": "translated text"
}}"""
        
        try:
            response = model.generate_content(prompt)
            text_response = response.text.strip()
            if text_response.startswith("```"):
                text_response = text_response.split("\n", 1)[1]
            if text_response.endswith("```"):
                text_response = text_response.rsplit("```", 1)[0]
            return json.loads(text_response.strip())
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return {
                "source_language": source_lang or "unknown",
                "target_language": target_lang,
                "original_text": text,
                "translated_text": text,
                "error": "Translation unavailable",
            }
    
    async def classify_emergency(self, text: str) -> dict:
        """Classify emergency type and priority from text."""
        return await self.analyze_emergency_text(text)
    
    def _fallback_analysis(self, text: str) -> dict:
        """Fallback when AI is unavailable."""
        # Basic keyword matching
        text_lower = text.lower()
        
        category = "OTHER"
        priority = "MEDIUM"
        
        accident_keywords = ["accident", "crash", "collision", "एक्सीडेंट", "दुर्घटना", "टक्कर"]
        medical_keywords = ["breathing", "blood", "pain", "unconscious", "सांस", "खून", "दर्द", "बेहोश"]
        fire_keywords = ["fire", "burning", "smoke", "आग", "धुआं"]
        
        for kw in accident_keywords:
            if kw in text_lower:
                category = "ROAD_ACCIDENT"
                break
        for kw in medical_keywords:
            if kw in text_lower:
                if category == "OTHER":
                    category = "MEDICAL"
                priority = "HIGH"
                break
        for kw in fire_keywords:
            if kw in text_lower:
                category = "FIRE"
                priority = "HIGH"
                break
        
        unconscious_kw = ["unconscious", "बेहोश", "not breathing", "सांस नहीं"]
        for kw in unconscious_kw:
            if kw in text_lower:
                priority = "CRITICAL"
                break
        
        return {
            "detected_language": "unknown",
            "detected_language_name": "Unknown",
            "original_text": text,
            "translation": text,
            "category": category,
            "priority": priority,
            "summary": text[:200],
            "required_services": ["AMBULANCE"],
            "key_details": [],
            "confidence": 0.3,
            "fallback": True,
        }
